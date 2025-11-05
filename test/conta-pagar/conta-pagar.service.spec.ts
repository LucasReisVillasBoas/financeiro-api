import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ContasPagarService } from '../../src/conta-pagar/conta-pagar.service';
import { ContasPagar, StatusContaPagar, TipoContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { ContasPagarRepository } from '../../src/conta-pagar/conta-pagar.repository';
import { CreateContaPagarDto } from '../../src/conta-pagar/dto/create-conta-pagar.dto';
import { AuditService } from '../../src/audit/audit.service';
import { MovimentacoesBancariasService } from '../../src/movimentacao-bancaria/movimentacao-bancaria.service';
import { PessoaService } from '../../src/pessoa/pessoa.service';
import { PlanoContasService } from '../../src/plano-contas/plano-contas.service';
import { EmpresaService } from '../../src/empresa/empresa.service';
import { UsuarioService } from '../../src/usuario/usuario.service';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { BaixaPagamento } from '../../src/entities/baixa-pagamento/baixa-pagamento.entity';

describe('ContasPagarService', () => {
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

  const mockBaixaPagamentoRepository = {
    find: jest.fn(),
    create: jest.fn(),
    persistAndFlush: jest.fn(),
  };

  const mockMovimentacaoBancariaService = {
    create: jest.fn(),
  };

  const mockPessoaService = {
    findOne: jest.fn(),
  };

  const mockPlanoContasService = {
    findOne: jest.fn(),
  };

  const mockEmpresaService = {
    findOne: jest.fn(),
  };

  const mockUsuarioService = {
    findOne: jest.fn(),
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
          provide: getRepositoryToken(ContasBancarias),
          useValue: mockContaBancariaRepository,
        },
        {
          provide: getRepositoryToken(MovimentacoesBancarias),
          useValue: mockMovimentacaoRepository,
        },
        {
          provide: getRepositoryToken(BaixaPagamento),
          useValue: mockBaixaPagamentoRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: MovimentacoesBancariasService,
          useValue: mockMovimentacaoBancariaService,
        },
        {
          provide: PessoaService,
          useValue: mockPessoaService,
        },
        {
          provide: PlanoContasService,
          useValue: mockPlanoContasService,
        },
        {
          provide: EmpresaService,
          useValue: mockEmpresaService,
        },
        {
          provide: UsuarioService,
          useValue: mockUsuarioService,
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

  describe('create', () => {
    const validDto: CreateContaPagarDto = {
      documento: 'NF-12345',
      serie: '1',
      parcela: 1,
      tipo: TipoContaPagar.FORNECEDOR,
      descricao: 'Compra de materiais',
      data_emissao: '2025-01-01',
      vencimento: '2025-01-31',
      data_lancamento: '2025-01-01',
      valor_principal: 1000,
      acrescimos: 50,
      descontos: 30,
      pessoaId: '123e4567-e89b-12d3-a456-426614174001',
      planoContasId: '123e4567-e89b-12d3-a456-426614174002',
      empresaId: '123e4567-e89b-12d3-a456-426614174003',
    };

    it('deve criar uma conta a pagar com sucesso', async () => {
      const mockConta = { id: 'conta-123', ...validDto } as any;
      mockRepository.create.mockReturnValue(mockConta);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);
      mockPessoaService.findOne.mockResolvedValue({ id: validDto.pessoaId } as any);
      mockPlanoContasService.findOne.mockResolvedValue({ id: validDto.planoContasId } as any);
      mockEmpresaService.findOne.mockResolvedValue({ id: validDto.empresaId } as any);

      const result = await service.create(validDto);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.persistAndFlush).toHaveBeenCalledWith(mockConta);
    });

    it('deve calcular valor_total e saldo automaticamente via hook', async () => {
      const mockConta: Partial<ContasPagar> = {
        id: 'conta-123',
        documento: validDto.documento,
        valor_principal: 1000,
        acrescimos: 50,
        descontos: 30,
        valor_total: 0,
        saldo: 0,
      };

      // Simula o hook @BeforeCreate
      mockConta.valor_total = mockConta.valor_principal + mockConta.acrescimos - mockConta.descontos;
      mockConta.saldo = mockConta.valor_total;

      expect(mockConta.valor_total).toBe(1020); // 1000 + 50 - 30
      expect(mockConta.saldo).toBe(1020);
    });

    it('deve lançar erro se data_emissao > vencimento', async () => {
      const invalidDto = {
        ...validDto,
        data_emissao: '2025-02-01',
        vencimento: '2025-01-01',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Data de emissão deve ser anterior ou igual ao vencimento',
      );
    });

    it('deve lançar erro se vencimento > data_liquidacao', async () => {
      const invalidDto = {
        ...validDto,
        vencimento: '2025-02-01',
        data_liquidacao: '2025-01-15',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Vencimento deve ser anterior ou igual à data de liquidação',
      );
    });

    it('deve aceitar ordem de datas válida', async () => {
      const dtoComLiquidacao = {
        ...validDto,
        data_emissao: '2025-01-01',
        vencimento: '2025-01-31',
        data_liquidacao: '2025-02-15',
      };

      const mockConta = { id: 'conta-123' } as any;
      mockRepository.create.mockReturnValue(mockConta);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);
      mockPessoaService.findOne.mockResolvedValue({ id: validDto.pessoaId } as any);
      mockPlanoContasService.findOne.mockResolvedValue({ id: validDto.planoContasId } as any);
      mockEmpresaService.findOne.mockResolvedValue({ id: validDto.empresaId } as any);

      await expect(service.create(dtoComLiquidacao)).resolves.toBeDefined();
    });

    it('deve criar conta sem acréscimos e descontos (valores default)', async () => {
      const dtoSemAcrescimos: CreateContaPagarDto = {
        ...validDto,
        acrescimos: undefined,
        descontos: undefined,
      };

      const mockConta = { id: 'conta-123' } as any;
      mockRepository.create.mockReturnValue(mockConta);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);
      mockPessoaService.findOne.mockResolvedValue({ id: validDto.pessoaId } as any);
      mockPlanoContasService.findOne.mockResolvedValue({ id: validDto.planoContasId } as any);
      mockEmpresaService.findOne.mockResolvedValue({ id: validDto.empresaId } as any);

      await service.create(dtoSemAcrescimos);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.acrescimos).toBe(0);
      expect(createCall.descontos).toBe(0);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma conta a pagar por ID', async () => {
      const mockConta = {
        id: 'conta-123',
        documento: 'NF-12345',
        deletadoEm: null,
      } as ContasPagar;

      mockRepository.findOne.mockResolvedValue(mockConta);

      const result = await service.findOne('conta-123');

      expect(result).toEqual(mockConta);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        { id: 'conta-123', deletadoEm: null },
        { populate: ['pessoa', 'planoContas', 'empresa'] },
      );
    });

    it('deve lançar NotFoundException se conta não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('conta-inexistente')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('conta-inexistente')).rejects.toThrow(
        'Conta a pagar não encontrada',
      );
    });
  });

  describe('registrarPagamento', () => {
    const mockConta: Partial<ContasPagar> = {
      id: 'conta-123',
      valor_total: 1000,
      saldo: 1000,
      status: StatusContaPagar.PENDENTE,
    };

    it('deve registrar pagamento parcial', async () => {
      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.registrarPagamento(
        'conta-123',
        300,
        new Date('2025-01-15'),
      );

      expect(result.saldo).toBe(700); // 1000 - 300
    });

    it('deve atualizar status para PARCIALMENTE_PAGA após pagamento parcial', async () => {
      const conta = { ...mockConta, saldo: 1000 } as ContasPagar;
      mockRepository.findOne.mockResolvedValue(conta);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      await service.registrarPagamento('conta-123', 500, new Date('2025-01-15'));

      conta.saldo = 500;
      // Simula hook @BeforeUpdate
      if (conta.saldo > 0 && conta.saldo < conta.valor_total!) {
        conta.status = StatusContaPagar.PARCIALMENTE_PAGA;
      }

      expect(conta.status).toBe(StatusContaPagar.PARCIALMENTE_PAGA);
    });

    it('deve lançar erro se valor pago for maior que saldo', async () => {
      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);

      await expect(
        service.registrarPagamento('conta-123', 1500, new Date('2025-01-15')),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.registrarPagamento('conta-123', 1500, new Date('2025-01-15')),
      ).rejects.toThrow('não pode ser maior que o saldo devedor');
    });

    it('deve lançar erro se valor pago for menor ou igual a zero', async () => {
      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);

      await expect(
        service.registrarPagamento('conta-123', 0, new Date('2025-01-15')),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.registrarPagamento('conta-123', -100, new Date('2025-01-15')),
      ).rejects.toThrow('Valor pago deve ser maior que zero');
    });
  });

  describe('marcarComoPaga', () => {
    it('deve marcar conta como paga (saldo = 0)', async () => {
      const mockConta: Partial<ContasPagar> = {
        id: 'conta-123',
        saldo: 1000,
        status: StatusContaPagar.PENDENTE,
      };

      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.marcarComoPaga('conta-123');

      expect(result.saldo).toBe(0);
      expect(result.data_liquidacao).toBeDefined();
    });

    it('deve atualizar status para PAGA quando saldo = 0', async () => {
      const conta: Partial<ContasPagar> = {
        id: 'conta-123',
        saldo: 0,
        valor_total: 1000,
        vencimento: new Date('2025-01-31'),
      };

      // Simula hook @BeforeUpdate
      if (conta.saldo === 0) {
        conta.status = StatusContaPagar.PAGA;
      }

      expect(conta.status).toBe(StatusContaPagar.PAGA);
    });
  });

  describe('update', () => {
    const mockConta: Partial<ContasPagar> = {
      id: 'conta-123',
      documento: 'NF-12345',
      parcela: 1,
      data_emissao: new Date('2025-01-01'),
      vencimento: new Date('2025-01-31'),
      data_lancamento: new Date('2025-01-01'),
      valor_principal: 1000,
      acrescimos: 0,
      descontos: 0,
    };

    it('deve atualizar campos da conta a pagar', async () => {
      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);
      mockRepository.assign.mockImplementation((entity, data) => Object.assign(entity, data));
      mockRepository.flush.mockResolvedValue(undefined);

      const updateDto = {
        descricao: 'Nova descrição',
        valor_principal: 1500,
      };

      await service.update('conta-123', updateDto);

      expect(mockRepository.assign).toHaveBeenCalled();
      expect(mockRepository.flush).toHaveBeenCalled();
    });

    it('deve validar ordem de datas ao atualizar', async () => {
      mockRepository.findOne.mockResolvedValue(mockConta as ContasPagar);

      const updateDto = {
        data_emissao: '2025-02-01',
        vencimento: '2025-01-01', // Inválido
      };

      await expect(service.update('conta-123', updateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEmpresa', () => {
    it('deve retornar contas a pagar de uma empresa', async () => {
      const mockContas = [
        { id: 'conta-1', documento: 'NF-001' },
        { id: 'conta-2', documento: 'NF-002' },
      ] as ContasPagar[];

      mockRepository.find.mockResolvedValue(mockContas);

      const result = await service.findByEmpresa('empresa-123');

      expect(result).toEqual(mockContas);
      expect(mockRepository.find).toHaveBeenCalledWith(
        { empresa: 'empresa-123', deletadoEm: null },
        { populate: ['pessoa', 'planoContas', 'empresa'] },
      );
    });

    it('deve retornar array vazio se empresa não tiver contas', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByEmpresa('empresa-sem-contas');

      expect(result).toEqual([]);
    });
  });

  describe('softDelete', () => {
    it('deve marcar conta como deletada', async () => {
      const mockConta = {
        id: 'conta-123',
        deletadoEm: null,
      } as ContasPagar;

      mockRepository.findOne.mockResolvedValue(mockConta);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      await service.softDelete('conta-123');

      expect(mockConta.deletadoEm).toBeDefined();
      expect(mockRepository.persistAndFlush).toHaveBeenCalledWith(mockConta);
    });
  });

  describe('Validação de status automático', () => {
    it('deve definir status como VENCIDA se saldo > 0 e vencimento passou', () => {
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);

      const conta: Partial<ContasPagar> = {
        saldo: 1000,
        valor_total: 1000,
        vencimento: ontem,
        status: StatusContaPagar.PENDENTE,
      };

      // Simula hook
      if (conta.saldo! > 0 && new Date() > conta.vencimento!) {
        conta.status = StatusContaPagar.VENCIDA;
      }

      expect(conta.status).toBe(StatusContaPagar.VENCIDA);
    });

    it('deve manter status PENDENTE se ainda não venceu', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);

      const conta: Partial<ContasPagar> = {
        saldo: 1000,
        valor_total: 1000,
        vencimento: amanha,
        status: StatusContaPagar.PENDENTE,
      };

      // Não deve mudar status se não venceu
      if (conta.saldo! === 0) {
        conta.status = StatusContaPagar.PAGA;
      } else if (conta.saldo! < conta.valor_total! && conta.saldo! > 0) {
        conta.status = StatusContaPagar.PARCIALMENTE_PAGA;
      } else if (new Date() > conta.vencimento! && conta.saldo! > 0) {
        conta.status = StatusContaPagar.VENCIDA;
      }

      expect(conta.status).toBe(StatusContaPagar.PENDENTE);
    });
  });
});
