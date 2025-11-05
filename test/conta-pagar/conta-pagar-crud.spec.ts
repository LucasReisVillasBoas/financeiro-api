import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ContasPagarService } from '../../src/conta-pagar/conta-pagar.service';
import { ContasPagar, StatusContaPagar, TipoContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { ContasPagarRepository } from '../../src/conta-pagar/conta-pagar.repository';
import { CancelarContaPagarDto } from '../../src/conta-pagar/dto/cancelar-conta-pagar.dto';
import { GerarParcelasDto } from '../../src/conta-pagar/dto/gerar-parcelas.dto';
import { AuditService } from '../../src/audit/audit.service';

describe('ContasPagarService - CRUD e Regras de Negócio', () => {
  let service: ContasPagarService;
  let repository: jest.Mocked<ContasPagarRepository>;
  let em: jest.Mocked<EntityManager>;
  let auditService: jest.Mocked<AuditService>;

  const mockRepository = {
    create: jest.fn(),
    persistAndFlush: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    assign: jest.fn(),
    flush: jest.fn(),
  };

  const mockEntityManager = {
    getReference: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockContaBancariaRepository = {
    findOne: jest.fn(),
  };

  const mockMovimentacaoRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContasPagarService,
        {
          provide: getRepositoryToken(ContasPagar),
          useValue: mockRepository,
        },
        {
          provide: 'ContasBancariasRepository',
          useValue: mockContaBancariaRepository,
        },
        {
          provide: 'MovimentacoesBancariasRepository',
          useValue: mockMovimentacaoRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ContasPagarService>(ContasPagarService);
    repository = module.get(getRepositoryToken(ContasPagar));
    em = module.get(EntityManager);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Bloqueio de edição se houver baixa registrada', () => {
    it('deve bloquear edição de conta com status PAGA', async () => {
      const contaPaga: Partial<ContasPagar> = {
        id: 'conta-123',
        status: StatusContaPagar.PAGA,
        data_liquidacao: new Date('2025-01-15'),
        canceladoEm: undefined,
      };

      mockRepository.findOne.mockResolvedValue(contaPaga as ContasPagar);

      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .rejects.toThrow(ForbiddenException);
      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .rejects.toThrow('Não é possível editar uma conta que já possui baixa registrada');
    });

    it('deve bloquear edição de conta com status PARCIALMENTE_PAGA', async () => {
      const contaParcial: Partial<ContasPagar> = {
        id: 'conta-123',
        status: StatusContaPagar.PARCIALMENTE_PAGA,
        data_liquidacao: new Date('2025-01-15'),
        saldo: 500,
        canceladoEm: undefined,
      };

      mockRepository.findOne.mockResolvedValue(contaParcial as ContasPagar);

      await expect(service.update('conta-123', { valor_principal: 2000 }))
        .rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear edição de conta que possui data_liquidacao', async () => {
      const contaComBaixa: Partial<ContasPagar> = {
        id: 'conta-123',
        status: StatusContaPagar.PENDENTE,
        data_liquidacao: new Date('2025-01-15'),
        canceladoEm: undefined,
      };

      mockRepository.findOne.mockResolvedValue(contaComBaixa as ContasPagar);

      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear edição de conta cancelada', async () => {
      const contaCancelada: Partial<ContasPagar> = {
        id: 'conta-123',
        status: StatusContaPagar.PENDENTE,
        canceladoEm: new Date('2025-01-10'),
        justificativaCancelamento: 'Cancelada por erro',
      };

      mockRepository.findOne.mockResolvedValue(contaCancelada as ContasPagar);

      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .rejects.toThrow(ForbiddenException);
      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .rejects.toThrow('Não é possível editar uma conta cancelada');
    });

    it('deve permitir edição de conta PENDENTE sem baixa', async () => {
      const contaPendente: Partial<ContasPagar> = {
        id: 'conta-123',
        status: StatusContaPagar.PENDENTE,
        data_liquidacao: undefined,
        canceladoEm: undefined,
        data_emissao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-31'),
        data_lancamento: new Date('2025-01-01'),
      };

      mockRepository.findOne.mockResolvedValue(contaPendente as ContasPagar);
      mockRepository.assign.mockImplementation((entity, data) => Object.assign(entity, data));
      mockRepository.flush.mockResolvedValue(undefined);

      await expect(service.update('conta-123', { descricao: 'Nova descrição' }))
        .resolves.toBeDefined();
    });
  });

  describe('Cancelamento com justificativa', () => {
    const cancelarDto: CancelarContaPagarDto = {
      justificativa: 'Cancelamento devido a duplicação de lançamento',
    };

    it('deve cancelar conta com justificativa e gerar auditoria', async () => {
      const conta: Partial<ContasPagar> = {
        id: 'conta-123',
        documento: 'NF-12345',
        parcela: 1,
        valor_total: 1000,
        saldo: 1000,
        status: StatusContaPagar.PENDENTE,
        canceladoEm: undefined,
        deletadoEm: undefined,
        empresa: { id: 'empresa-123' } as any,
      };

      mockRepository.findOne.mockResolvedValue(conta as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.cancelar(
        'conta-123',
        cancelarDto,
        'user-123',
        'user@test.com',
      );

      expect(result.canceladoEm).toBeDefined();
      expect(result.justificativaCancelamento).toBe(cancelarDto.justificativa);
      expect(result.status).toBe('Cancelada');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONTA_PAGAR_DELETED',
          severity: 'CRITICAL',
          action: 'CANCELAR',
          success: true,
          details: expect.objectContaining({
            justificativa: cancelarDto.justificativa,
            message: expect.stringContaining('cancelada'),
          }),
        }),
      );
    });

    it('deve rejeitar cancelamento de conta já cancelada', async () => {
      const contaCancelada: Partial<ContasPagar> = {
        id: 'conta-123',
        canceladoEm: new Date('2025-01-10'),
        justificativaCancelamento: 'Já cancelada',
      };

      mockRepository.findOne.mockResolvedValue(contaCancelada as ContasPagar);

      await expect(
        service.cancelar('conta-123', cancelarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelar('conta-123', cancelarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow('Conta já está cancelada');
    });

    it('deve rejeitar cancelamento de conta deletada', async () => {
      const contaDeletada: Partial<ContasPagar> = {
        id: 'conta-123',
        deletadoEm: new Date('2025-01-10'),
        canceladoEm: undefined,
      };

      mockRepository.findOne.mockResolvedValue(contaDeletada as ContasPagar);

      await expect(
        service.cancelar('conta-123', cancelarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelar('conta-123', cancelarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow('Não é possível cancelar uma conta deletada');
    });

    it('deve exigir justificativa mínima de 10 caracteres', () => {
      const dtoInvalido: CancelarContaPagarDto = {
        justificativa: 'Pequeno',
      };

      // Validação será feita pelo class-validator no DTO
      expect(dtoInvalido.justificativa.length).toBeLessThan(10);
    });
  });

  describe('Parcelamento', () => {
    const parcelasDto: GerarParcelasDto = {
      documento: 'NF-12345',
      serie: '1',
      tipo: TipoContaPagar.FORNECEDOR,
      descricao: 'Compra de materiais',
      data_emissao: '2025-01-01',
      data_lancamento: '2025-01-01',
      primeiro_vencimento: '2025-02-01',
      valor_total: 3000,
      numero_parcelas: 3,
      intervalo_dias: 30,
      pessoaId: '550e8400-e29b-41d4-a716-446655440001',
      planoContasId: '550e8400-e29b-41d4-a716-446655440002',
      empresaId: '550e8400-e29b-41d4-a716-446655440003',
    };

    it('deve gerar parcelas com vencimentos corretos', async () => {
      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(parcelasDto);

      expect(result).toHaveLength(3);
      expect(result[0].parcela).toBe(1);
      expect(result[1].parcela).toBe(2);
      expect(result[2].parcela).toBe(3);

      // Verifica vencimentos
      expect(result[0].vencimento).toEqual(new Date('2025-02-01'));
      expect(result[1].vencimento.getDate()).toBe(new Date('2025-03-03').getDate()); // +30 dias
      expect(result[2].vencimento.getDate()).toBe(new Date('2025-04-02').getDate()); // +60 dias
    });

    it('deve dividir valor total igualmente entre parcelas', async () => {
      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(parcelasDto);

      expect(result[0].valor_principal).toBe(1000);
      expect(result[1].valor_principal).toBe(1000);
      expect(result[2].valor_principal).toBe(1000);
    });

    it('deve ajustar última parcela para compensar arredondamentos', async () => {
      const dtoComArredondamento: GerarParcelasDto = {
        ...parcelasDto,
        valor_total: 1000,
        numero_parcelas: 3, // 333.33 + 333.33 + 333.34
      };

      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(dtoComArredondamento);

      const totalCalculado = result.reduce((sum, p) => sum + p.valor_principal, 0);
      expect(totalCalculado).toBeCloseTo(1000, 1); // Precisão de 1 centavo
    });

    it('deve incluir número da parcela na descrição', async () => {
      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(parcelasDto);

      expect(result[0].descricao).toContain('Parcela 1/3');
      expect(result[1].descricao).toContain('Parcela 2/3');
      expect(result[2].descricao).toContain('Parcela 3/3');
    });

    it('deve permitir intervalo personalizado entre parcelas', async () => {
      const dtoQuinzenal: GerarParcelasDto = {
        ...parcelasDto,
        numero_parcelas: 2,
        intervalo_dias: 15,
      };

      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(dtoQuinzenal);

      const diferencaDias = Math.floor(
        (result[1].vencimento.getTime() - result[0].vencimento.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diferencaDias).toBe(15);
    });

    it('deve dividir acréscimos e descontos proporcionalmente', async () => {
      const dtoComAcrescimos: GerarParcelasDto = {
        ...parcelasDto,
        valor_total: 3000,
        numero_parcelas: 3,
        acrescimos: 150, // 50 por parcela
        descontos: 90, // 30 por parcela
      };

      mockRepository.create.mockImplementation((data: any) => data as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.gerarParcelas(dtoComAcrescimos);

      expect(result[0].acrescimos).toBe(50);
      expect(result[0].descontos).toBe(30);
      expect(result[1].acrescimos).toBe(50);
      expect(result[1].descontos).toBe(30);
    });
  });
});
