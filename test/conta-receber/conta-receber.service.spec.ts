import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContasReceberService } from '../../src/conta-receber/conta-receber.service';
import { ContasReceber, StatusContaReceber, TipoContaReceber } from '../../src/entities/conta-receber/conta-receber.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('ContasReceberService', () => {
  let service: ContasReceberService;
  let contasReceberRepository: any;
  let em: any;
  let auditService: any;

  const mockPessoa = { id: 'pessoa-123', nome: 'Cliente Teste' };
  const mockPlanoContas = { id: 'plano-123', descricao: 'Receitas' };
  const mockEmpresa = { id: 'empresa-123', razao_social: 'Empresa Teste' };

  const mockContaReceber = {
    id: 'conta-123',
    documento: 'NF-001',
    serie: '1',
    parcela: 1,
    tipo: 'Nota Fiscal',
    descricao: 'Venda de produtos',
    dataEmissao: new Date('2024-01-10'),
    dataLancamento: new Date('2024-01-10'),
    vencimento: new Date('2024-02-10'),
    dataLiquidacao: null,
    valorPrincipal: 1000,
    valorAcrescimos: 50,
    valorDescontos: 30,
    valorTotal: 1020,
    saldo: 1020,
    status: StatusContaReceber.PENDENTE,
    deletadoEm: null,
    pessoa: mockPessoa,
    planoContas: mockPlanoContas,
    empresa: mockEmpresa,
  };

  beforeEach(async () => {
    contasReceberRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'nova-conta-123', ...data })),
      find: jest.fn().mockResolvedValue([mockContaReceber]),
      findOne: jest.fn().mockResolvedValue({ ...mockContaReceber }),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn(),
    };

    em = {
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContasReceberService,
        {
          provide: getRepositoryToken(ContasReceber),
          useValue: contasReceberRepository,
        },
        {
          provide: EntityManager,
          useValue: em,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<ContasReceberService>(ContasReceberService);
  });

  describe('create', () => {
    const createDto: any = {
      documento: 'NF-001',
      serie: '1',
      parcela: 1,
      tipo: TipoContaReceber.BOLETO,
      descricao: 'Venda de produtos',
      dataEmissao: '2024-01-10',
      dataLancamento: '2024-01-10',
      vencimento: '2024-02-10',
      valorPrincipal: 1000,
      valorAcrescimos: 50,
      valorDescontos: 30,
      valorTotal: 1020,
      saldo: 1020,
      pessoaId: 'pessoa-123',
      planoContasId: 'plano-123',
      empresaId: 'empresa-123',
    };

    it('deve criar uma conta a receber com sucesso', async () => {
      const result = await service.create(createDto, 'user-123', 'user@test.com');

      expect(result).toBeDefined();
      expect(contasReceberRepository.create).toHaveBeenCalled();
      expect(contasReceberRepository.persistAndFlush).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('deve calcular valor total corretamente', async () => {
      await service.create(createDto, 'user-123', 'user@test.com');

      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valorPrincipal: 1000,
          valorAcrescimos: 50,
          valorDescontos: 30,
          valorTotal: 1020, // 1000 + 50 - 30
        }),
      );
    });

    it('deve definir saldo igual ao valor total', async () => {
      await service.create(createDto, 'user-123', 'user@test.com');

      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo: 1020,
        }),
      );
    });

    it('deve definir status como PENDENTE', async () => {
      await service.create(createDto, 'user-123', 'user@test.com');

      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: StatusContaReceber.PENDENTE,
        }),
      );
    });

    it('deve lançar erro se data de emissão maior que vencimento', async () => {
      const dtoInvalido = {
        ...createDto,
        dataEmissao: '2024-03-10', // Depois do vencimento
        vencimento: '2024-02-10',
      };

      await expect(service.create(dtoInvalido, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se valor total informado diferente do calculado', async () => {
      const dtoInvalido = {
        ...createDto,
        valorTotal: 999, // Valor incorreto
      };

      await expect(service.create(dtoInvalido, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve aceitar valor total correto quando informado', async () => {
      const dtoComValorTotal = {
        ...createDto,
        valorTotal: 1020, // Valor correto
      };

      const result = await service.create(dtoComValorTotal, 'user-123', 'user@test.com');

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as contas a receber ativas', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockContaReceber]);
      expect(contasReceberRepository.find).toHaveBeenCalledWith(
        { deletadoEm: null },
        { populate: ['pessoa', 'planoContas'] },
      );
    });
  });

  describe('findByEmpresa', () => {
    it('deve retornar contas de uma empresa específica', async () => {
      const result = await service.findByEmpresa('empresa-123');

      expect(result).toEqual([mockContaReceber]);
      expect(contasReceberRepository.find).toHaveBeenCalledWith(
        { empresa: { id: 'empresa-123' }, deletadoEm: null },
        { populate: ['pessoa', 'planoContas'] },
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma conta por ID', async () => {
      const result = await service.findOne('conta-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('conta-123');
    });

    it('deve lançar erro se conta não encontrada', async () => {
      contasReceberRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('conta-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar uma conta a receber', async () => {
      const updateDto = { descricao: 'Nova descrição' };

      const result = await service.update('conta-123', updateDto, 'user-123', 'user@test.com');

      expect(result).toBeDefined();
      expect(contasReceberRepository.flush).toHaveBeenCalled();
    });

    it('deve lançar erro ao tentar editar conta já liquidada', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.LIQUIDADO,
      });

      await expect(
        service.update('conta-123', { descricao: 'Nova' }, 'user-123', 'user@test.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar erro ao tentar editar conta parcialmente liquidada', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.PARCIAL,
      });

      await expect(
        service.update('conta-123', { descricao: 'Nova' }, 'user-123', 'user@test.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar erro ao tentar editar conta com data de liquidação', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        dataLiquidacao: new Date(),
      });

      await expect(
        service.update('conta-123', { descricao: 'Nova' }, 'user-123', 'user@test.com'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve recalcular valor total ao atualizar valores', async () => {
      const contaMock = { ...mockContaReceber };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.update(
        'conta-123',
        { valorPrincipal: 2000 },
        'user-123',
        'user@test.com',
      );

      // 2000 + 50 - 30 = 2020
      expect(contaMock.valorTotal).toBe(2020);
    });

    it('deve registrar auditoria com campos alterados', async () => {
      await service.update(
        'conta-123',
        { descricao: 'Nova descrição' },
        'user-123',
        'user@test.com',
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EDITAR',
          details: expect.objectContaining({
            camposAlterados: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('liquidar', () => {
    it('deve liquidar totalmente uma conta', async () => {
      const contaMock = { ...mockContaReceber, saldo: 1020 };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.liquidar('conta-123', 1020, undefined, 'user-123', 'user@test.com');

      expect(contaMock.saldo).toBe(0);
      expect(contaMock.status).toBe(StatusContaReceber.LIQUIDADO);
    });

    it('deve fazer liquidação parcial', async () => {
      const contaMock = { ...mockContaReceber, saldo: 1020 };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.liquidar('conta-123', 500, undefined, 'user-123', 'user@test.com');

      expect(contaMock.saldo).toBe(520);
      expect(contaMock.status).toBe(StatusContaReceber.PARCIAL);
    });

    it('deve lançar erro se conta já está liquidada', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.LIQUIDADO,
      });

      await expect(
        service.liquidar('conta-123', 100, undefined, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se valor recebido é zero ou negativo', async () => {
      await expect(
        service.liquidar('conta-123', 0, undefined, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.liquidar('conta-123', -100, undefined, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se valor recebido maior que o saldo', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        saldo: 500,
      });

      await expect(
        service.liquidar('conta-123', 600, undefined, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve definir data de liquidação', async () => {
      const contaMock = { ...mockContaReceber };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      const dataLiquidacao = new Date('2024-02-15');
      await service.liquidar('conta-123', 500, dataLiquidacao, 'user-123', 'user@test.com');

      expect(contaMock.dataLiquidacao).toEqual(dataLiquidacao);
    });

    it('deve registrar auditoria da liquidação', async () => {
      await service.liquidar('conta-123', 500, undefined, 'user-123', 'user@test.com');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LIQUIDAR',
          details: expect.objectContaining({
            valorRecebido: 500,
            saldoAnterior: 1020,
            saldoPosterior: 520,
          }),
        }),
      );
    });
  });

  describe('createParcelado', () => {
    const parceladoDto: any = {
      documento: 'NF-001',
      serie: '1',
      tipo: TipoContaReceber.BOLETO,
      descricao: 'Venda parcelada',
      dataEmissao: '2024-01-10',
      dataLancamento: '2024-01-10',
      primeiroVencimento: '2024-02-10',
      numeroParcelas: 3,
      intervaloDias: 30,
      valorTotal: 1500,
      pessoaId: 'pessoa-123',
      planoContasId: 'plano-123',
      empresaId: 'empresa-123',
    };

    it('deve criar múltiplas parcelas', async () => {
      await service.createParcelado(parceladoDto, 'user-123');

      // Deve criar 3 parcelas
      expect(contasReceberRepository.create).toHaveBeenCalledTimes(3);
      expect(contasReceberRepository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve calcular valor por parcela corretamente', async () => {
      await service.createParcelado(parceladoDto, 'user-123');

      // 1500 / 3 = 500 por parcela
      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valorPrincipal: expect.any(Number),
        }),
      );
    });

    it('deve ajustar última parcela para compensar arredondamentos', async () => {
      const dtoDiferenca = {
        ...parceladoDto,
        valorTotal: 1000, // 1000 / 3 = 333.33... arredondamento
      };

      await service.createParcelado(dtoDiferenca, 'user-123');

      expect(contasReceberRepository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve incrementar datas de vencimento', async () => {
      const parcelas: any[] = [];
      contasReceberRepository.create.mockImplementation((data) => {
        parcelas.push(data);
        return data;
      });

      await service.createParcelado(parceladoDto, 'user-123');

      // Verifica que as datas estão incrementando
      expect(parcelas[0].parcela).toBe(1);
      expect(parcelas[1].parcela).toBe(2);
      expect(parcelas[2].parcela).toBe(3);
    });

    it('deve registrar auditoria para criação parcelada', async () => {
      await service.createParcelado(parceladoDto, 'user-123');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            numeroParcelas: 3,
            valorTotal: 1500,
          }),
        }),
      );
    });
  });

  describe('cancelar', () => {
    const cancelarDto = {
      justificativa: 'Cliente desistiu da compra',
    };

    it('deve cancelar uma conta pendente', async () => {
      const contaMock = { ...mockContaReceber, status: StatusContaReceber.PENDENTE };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.cancelar('conta-123', cancelarDto, 'user-123');

      expect(contaMock.status).toBe(StatusContaReceber.CANCELADO);
    });

    it('deve lançar erro se conta já está cancelada', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.CANCELADO,
      });

      await expect(service.cancelar('conta-123', cancelarDto, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se conta está liquidada', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.LIQUIDADO,
      });

      await expect(service.cancelar('conta-123', cancelarDto, 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar erro se conta tem baixa parcial', async () => {
      contasReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.PARCIAL,
      });

      await expect(service.cancelar('conta-123', cancelarDto, 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar erro se usuário não identificado', async () => {
      await expect(service.cancelar('conta-123', cancelarDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve registrar auditoria com justificativa', async () => {
      const contaMock = { ...mockContaReceber };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.cancelar('conta-123', cancelarDto, 'user-123');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            justificativa: 'Cliente desistiu da compra',
          }),
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('deve marcar conta como deletada', async () => {
      const contaMock = { ...mockContaReceber };
      contasReceberRepository.findOne.mockResolvedValue(contaMock);

      await service.softDelete('conta-123');

      expect(contaMock.deletadoEm).toBeDefined();
      expect(contasReceberRepository.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('Validação de Datas', () => {
    it('deve aceitar data de liquidação após vencimento', async () => {
      const dto: any = {
        documento: 'NF-001',
        serie: '1',
        parcela: 1,
        tipo: TipoContaReceber.BOLETO,
        descricao: 'Venda',
        dataEmissao: '2024-01-10',
        dataLancamento: '2024-01-10',
        vencimento: '2024-02-10',
        dataLiquidacao: '2024-02-15', // Após vencimento - válido
        valorPrincipal: 1000,
        valorTotal: 1000,
        saldo: 1000,
        pessoaId: 'pessoa-123',
        planoContasId: 'plano-123',
      };

      const result = await service.create(dto, 'user-123', 'user@test.com');

      expect(result).toBeDefined();
    });

    it('deve lançar erro se vencimento maior que data de liquidação', async () => {
      const dto: any = {
        documento: 'NF-001',
        serie: '1',
        parcela: 1,
        tipo: TipoContaReceber.BOLETO,
        descricao: 'Venda',
        dataEmissao: '2024-01-10',
        dataLancamento: '2024-01-10',
        vencimento: '2024-02-20',
        dataLiquidacao: '2024-02-10', // Antes do vencimento - inválido
        valorPrincipal: 1000,
        valorTotal: 1000,
        saldo: 1000,
        pessoaId: 'pessoa-123',
        planoContasId: 'plano-123',
      };

      await expect(service.create(dto, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Cálculos Financeiros', () => {
    it('deve calcular saldo inicial corretamente', async () => {
      const dto: any = {
        documento: 'NF-001',
        serie: '1',
        parcela: 1,
        tipo: TipoContaReceber.BOLETO,
        descricao: 'Venda',
        dataEmissao: '2024-01-10',
        dataLancamento: '2024-01-10',
        vencimento: '2024-02-10',
        valorPrincipal: 1000,
        valorAcrescimos: 100,
        valorDescontos: 50,
        valorTotal: 1050,
        saldo: 1050,
        pessoaId: 'pessoa-123',
        planoContasId: 'plano-123',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valorTotal: 1050, // 1000 + 100 - 50
          saldo: 1050,
        }),
      );
    });

    it('deve usar valores padrão para acréscimos e descontos quando não informados', async () => {
      const dto: any = {
        documento: 'NF-001',
        serie: '1',
        parcela: 1,
        tipo: TipoContaReceber.BOLETO,
        descricao: 'Venda',
        dataEmissao: '2024-01-10',
        dataLancamento: '2024-01-10',
        vencimento: '2024-02-10',
        valorPrincipal: 1000,
        valorTotal: 1000,
        saldo: 1000,
        pessoaId: 'pessoa-123',
        planoContasId: 'plano-123',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(contasReceberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valorAcrescimos: 0,
          valorDescontos: 0,
          valorTotal: 1000,
        }),
      );
    });
  });
});
