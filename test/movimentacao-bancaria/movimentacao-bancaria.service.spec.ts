import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { MovimentacoesBancariasService } from '../../src/movimentacao-bancaria/movimentacao-bancaria.service';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancariasRepository } from '../../src/conta-bancaria/conta-bancaria.repository';
import { AuditService } from '../../src/audit/audit.service';

describe('MovimentacoesBancariasService', () => {
  let service: MovimentacoesBancariasService;
  let movimentacaoRepository: any;
  let contasBancariasRepository: any;
  let auditService: any;

  const mockContaBancaria = {
    id: 'conta-123',
    banco: 'Banco do Brasil',
    saldo_atual: 5000,
    deletadoEm: null,
  };

  const mockMovimentacao = {
    id: 'mov-123',
    dataMovimento: new Date('2024-01-15'),
    descricao: 'Pagamento fornecedor',
    valor: 500,
    tipoMovimento: 'Saída',
    contaBancaria: mockContaBancaria,
    conciliado: 'N',
    deletadoEm: null,
  };

  beforeEach(async () => {
    movimentacaoRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'nova-mov-123', ...data })),
      find: jest.fn().mockResolvedValue([mockMovimentacao]),
      findOne: jest.fn().mockResolvedValue(mockMovimentacao),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn(),
    };

    contasBancariasRepository = {
      findOne: jest.fn().mockResolvedValue({ ...mockContaBancaria }),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimentacoesBancariasService,
        {
          provide: getRepositoryToken(MovimentacoesBancarias),
          useValue: movimentacaoRepository,
        },
        {
          provide: ContasBancariasRepository,
          useValue: contasBancariasRepository,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<MovimentacoesBancariasService>(MovimentacoesBancariasService);
  });

  describe('create', () => {
    const createDto = {
      contaBancaria: 'conta-123',
      dataMovimento: '2024-01-15',
      descricao: 'Pagamento fornecedor',
      valor: 500,
      tipoMovimento: 'Saída',
      conta: 'Conta corrente',
      categoria: 'Despesas',
    };

    it('deve criar uma movimentação de saída com sucesso', async () => {
      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(movimentacaoRepository.create).toHaveBeenCalled();
      expect(movimentacaoRepository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve criar uma movimentação de entrada com sucesso', async () => {
      const entradaDto = { ...createDto, tipoMovimento: 'Entrada' };

      const result = await service.create(entradaDto);

      expect(result).toBeDefined();
    });

    it('deve lançar erro se conta bancária não encontrada', async () => {
      contasBancariasRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve debitar saldo para movimentação de saída', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 5000 };
      contasBancariasRepository.findOne.mockResolvedValue(contaBancariaMock);

      await service.create(createDto);

      // Saída deve debitar: 5000 - 500 = 4500
      expect(contaBancariaMock.saldo_atual).toBe(4500);
    });

    it('deve creditar saldo para movimentação de entrada', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 5000 };
      contasBancariasRepository.findOne.mockResolvedValue(contaBancariaMock);

      const entradaDto = { ...createDto, tipoMovimento: 'Entrada' };
      await service.create(entradaDto);

      // Entrada deve creditar: 5000 + 500 = 5500
      expect(contaBancariaMock.saldo_atual).toBe(5500);
    });

    it('deve creditar saldo para movimentação de crédito', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 5000 };
      contasBancariasRepository.findOne.mockResolvedValue(contaBancariaMock);

      const creditoDto = { ...createDto, tipoMovimento: 'Crédito' };
      await service.create(creditoDto);

      expect(contaBancariaMock.saldo_atual).toBe(5500);
    });

    it('deve usar campo data se dataMovimento não fornecido', async () => {
      const dtoComData = {
        ...createDto,
        dataMovimento: undefined,
        data: '2024-01-20',
      };

      const result = await service.create(dtoComData);

      expect(result).toBeDefined();
    });

    it('deve usar campo tipo se tipoMovimento não fornecido', async () => {
      const dtoComTipo = {
        ...createDto,
        tipoMovimento: undefined,
        tipo: 'Saída',
      };

      const result = await service.create(dtoComTipo);

      expect(result).toBeDefined();
    });

    it('deve registrar auditoria para lançamento manual', async () => {
      const manualDto = {
        ...createDto,
        referencia: undefined, // Lançamento manual
        empresaId: 'empresa-123',
      };

      await service.create(manualDto, 'user-123', 'user@test.com');

      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as movimentações', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockMovimentacao]);
      expect(movimentacaoRepository.find).toHaveBeenCalledWith(
        { deletadoEm: null },
        expect.any(Object),
      );
    });
  });

  describe('findByPeriodo', () => {
    it('deve retornar movimentações no período', async () => {
      const result = await service.findByPeriodo('2024-01-01', '2024-01-31');

      expect(result).toEqual([mockMovimentacao]);
      expect(movimentacaoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          dataMovimento: expect.any(Object),
          deletadoEm: null,
        }),
        expect.any(Object),
      );
    });
  });

  describe('findByConta', () => {
    it('deve retornar movimentações de uma conta específica', async () => {
      const result = await service.findByConta('conta-123');

      expect(result).toEqual([mockMovimentacao]);
      expect(movimentacaoRepository.find).toHaveBeenCalledWith(
        { contaBancaria: 'conta-123', deletadoEm: null },
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma movimentação por ID', async () => {
      const result = await service.findOne('mov-123');

      expect(result).toEqual(mockMovimentacao);
    });

    it('deve lançar erro se movimentação não encontrada', async () => {
      movimentacaoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('mov-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma movimentação', async () => {
      const updateDto = { descricao: 'Nova descrição' };

      const result = await service.update('mov-123', updateDto);

      expect(result).toBeDefined();
      expect(movimentacaoRepository.assign).toHaveBeenCalled();
      expect(movimentacaoRepository.flush).toHaveBeenCalled();
    });

    it('deve atualizar dataMovimento quando data fornecida', async () => {
      const updateDto = { data: '2024-02-01' };

      await service.update('mov-123', updateDto);

      expect(movimentacaoRepository.assign).toHaveBeenCalledWith(
        mockMovimentacao,
        expect.objectContaining({
          dataMovimento: expect.any(Date),
        }),
      );
    });

    it('deve atualizar tipoMovimento quando tipo fornecido', async () => {
      const updateDto = { tipo: 'Entrada' };

      await service.update('mov-123', updateDto);

      expect(movimentacaoRepository.assign).toHaveBeenCalledWith(
        mockMovimentacao,
        expect.objectContaining({
          tipoMovimento: 'Entrada',
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('deve marcar movimentação como deletada', async () => {
      await service.softDelete('mov-123');

      expect(mockMovimentacao.deletadoEm).toBeDefined();
      expect(movimentacaoRepository.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('conciliar', () => {
    const conciliarDto = {
      movimentacaoIds: ['mov-123', 'mov-456'],
    };

    it('deve conciliar movimentações com sucesso', async () => {
      movimentacaoRepository.find.mockResolvedValue([
        { ...mockMovimentacao, conciliado: 'N' },
        { ...mockMovimentacao, id: 'mov-456', conciliado: 'N' },
      ]);

      const result = await service.conciliar(conciliarDto, 'user-123', 'user@test.com');

      expect(result.conciliadas).toBe(2);
      expect(result.erros).toHaveLength(0);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('deve reportar erro para movimentações já conciliadas', async () => {
      movimentacaoRepository.find.mockResolvedValue([
        { ...mockMovimentacao, conciliado: 'S', conciliadoEm: new Date() },
      ]);

      const result = await service.conciliar(conciliarDto, 'user-123', 'user@test.com');

      expect(result.conciliadas).toBe(0);
      expect(result.erros.length).toBeGreaterThan(0);
    });

    it('deve lançar erro se nenhuma movimentação encontrada', async () => {
      movimentacaoRepository.find.mockResolvedValue([]);

      await expect(
        service.conciliar(conciliarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve marcar movimentações com data e usuário de conciliação', async () => {
      const movMock: any = { ...mockMovimentacao, conciliado: 'N', conciliadoEm: undefined, conciliadoPor: undefined };
      movimentacaoRepository.find.mockResolvedValue([movMock]);

      await service.conciliar(conciliarDto, 'user-123', 'user@test.com');

      expect(movMock.conciliado).toBe('S');
      expect(movMock.conciliadoEm).toBeDefined();
      expect(movMock.conciliadoPor).toBe('user-123');
    });
  });

  describe('desconciliar', () => {
    const desconciliarDto = {
      movimentacaoIds: ['mov-123'],
    };

    it('deve desconciliar movimentações com sucesso', async () => {
      movimentacaoRepository.find.mockResolvedValue([
        { ...mockMovimentacao, conciliado: 'S', conciliadoEm: new Date(), conciliadoPor: 'user-old' },
      ]);

      const result = await service.desconciliar(desconciliarDto, 'user-123', 'user@test.com');

      expect(result.desconciliadas).toBe(1);
      expect(result.erros).toHaveLength(0);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('deve reportar erro para movimentações já desconciliadas', async () => {
      movimentacaoRepository.find.mockResolvedValue([
        { ...mockMovimentacao, conciliado: 'N' },
      ]);

      const result = await service.desconciliar(desconciliarDto, 'user-123', 'user@test.com');

      expect(result.desconciliadas).toBe(0);
      expect(result.erros.length).toBeGreaterThan(0);
    });

    it('deve lançar erro se nenhuma movimentação encontrada', async () => {
      movimentacaoRepository.find.mockResolvedValue([]);

      await expect(
        service.desconciliar(desconciliarDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve limpar dados de conciliação', async () => {
      const movMock: any = {
        ...mockMovimentacao,
        conciliado: 'S',
        conciliadoEm: new Date(),
        conciliadoPor: 'user-old',
      };
      movimentacaoRepository.find.mockResolvedValue([movMock]);

      await service.desconciliar(desconciliarDto, 'user-123', 'user@test.com');

      expect(movMock.conciliado).toBe('N');
      expect(movMock.conciliadoEm).toBeUndefined();
      expect(movMock.conciliadoPor).toBeUndefined();
    });
  });

  describe('Cálculos e Regras de Negócio', () => {
    it('deve atualizar saldo corretamente em múltiplas operações', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 1000 };
      contasBancariasRepository.findOne.mockResolvedValue(contaBancariaMock);

      // Primeira entrada de 500
      await service.create({
        contaBancaria: 'conta-123',
        dataMovimento: '2024-01-15',
        descricao: 'Entrada 1',
        valor: 500,
        tipoMovimento: 'Entrada',
        conta: 'CC',
        categoria: 'Receita',
      });

      expect(contaBancariaMock.saldo_atual).toBe(1500);

      // Saída de 200
      contaBancariaMock.saldo_atual = 1500; // Reset para simular estado
      await service.create({
        contaBancaria: 'conta-123',
        dataMovimento: '2024-01-16',
        descricao: 'Saída 1',
        valor: 200,
        tipoMovimento: 'Saída',
        conta: 'CC',
        categoria: 'Despesa',
      });

      expect(contaBancariaMock.saldo_atual).toBe(1300);
    });

    it('deve permitir saldo negativo', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 100 };
      contasBancariasRepository.findOne.mockResolvedValue(contaBancariaMock);

      await service.create({
        contaBancaria: 'conta-123',
        dataMovimento: '2024-01-15',
        descricao: 'Saída maior que saldo',
        valor: 500,
        tipoMovimento: 'Saída',
        conta: 'CC',
        categoria: 'Despesa',
      });

      expect(contaBancariaMock.saldo_atual).toBe(-400);
    });

    it('deve usar referência Manual quando não informada', async () => {
      await service.create({
        contaBancaria: 'conta-123',
        dataMovimento: '2024-01-15',
        descricao: 'Lançamento sem referência',
        valor: 100,
        tipoMovimento: 'Entrada',
        conta: 'CC',
        categoria: 'Receita',
      });

      expect(movimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referencia: 'Manual',
        }),
      );
    });
  });
});
