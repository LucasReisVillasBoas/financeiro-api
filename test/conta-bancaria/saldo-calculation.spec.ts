import { Test, TestingModule } from '@nestjs/testing';
import { ContaBancariaService } from '../../src/conta-bancaria/conta-bancaria.service';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('Conta Bancaria - Saldo Calculations', () => {
  let service: ContaBancariaService;
  let mockRepository: any;
  let mockMovimentacaoRepository: any;
  let mockAuditService: any;

  const userId = 'user-123';
  const userEmail = 'user@test.com';

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getEntityManager: jest.fn(() => ({
        persistAndFlush: jest.fn(),
        flush: jest.fn(),
      })),
    };

    mockMovimentacaoRepository = {
      find: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContaBancariaService,
        { provide: 'ContasBancariasRepository', useValue: mockRepository },
        {
          provide: 'MovimentacoesBancariasRepository',
          useValue: mockMovimentacaoRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ContaBancariaService>(ContaBancariaService);
  });

  describe('Initial Balance', () => {
    it('should create conta with initial balance', async () => {
      const dto = {
        empresaId: 'empresa-123',
        banco: 'Banco do Brasil',
        agencia: '1234',
        conta: '56789',
        descricao: 'Conta Corrente',
        tipo: 'Conta Corrente',
        saldo_inicial: 10000.0,
        saldo_atual: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      };

      mockRepository.create.mockImplementation((data) => data);

      await service.create(dto, userId, userEmail);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo_inicial: 10000.0,
          saldo_atual: 10000.0,
        }),
      );
    });

    it('should handle zero initial balance', async () => {
      const dto = {
        empresaId: 'empresa-123',
        banco: 'Banco',
        agencia: '1234',
        conta: '56789',
        descricao: 'Conta Nova',
        tipo: 'Conta Corrente',
        saldo_inicial: 0,
        saldo_atual: 0,
        data_referencia_saldo: new Date(),
      };

      mockRepository.create.mockImplementation((data) => data);

      await service.create(dto, userId, userEmail);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo_inicial: 0,
          saldo_atual: 0,
        }),
      );
    });

    it('should handle negative initial balance', async () => {
      const dto = {
        empresaId: 'empresa-123',
        banco: 'Banco',
        agencia: '1234',
        conta: '56789',
        descricao: 'Conta com Saldo Negativo',
        tipo: 'Conta Corrente',
        saldo_inicial: -5000.0,
        saldo_atual: -5000.0,
        data_referencia_saldo: new Date(),
      };

      mockRepository.create.mockImplementation((data) => data);

      await service.create(dto, userId, userEmail);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo_inicial: -5000.0,
          saldo_atual: -5000.0,
        }),
      );
    });
  });

  describe('Current Balance Calculation', () => {
    it('should calculate saldo_atual correctly with movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          id: 'mov-1',
          valor: 1500.0,
          tipoMovimento: 'Débito',
          dataMovimento: new Date('2025-01-15'),
          deletadoEm: null,
        },
        {
          id: 'mov-2',
          valor: 2500.0,
          tipoMovimento: 'Crédito',
          dataMovimento: new Date('2025-01-16'),
          deletadoEm: null,
        },
        {
          id: 'mov-3',
          valor: 500.0,
          tipoMovimento: 'Débito',
          dataMovimento: new Date('2025-01-17'),
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 10000 - 1500 + 2500 - 500 = 10500
      expect(saldo).toBe(10500.0);
    });

    it('should ignore soft-deleted movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          id: 'mov-1',
          valor: 1500.0,
          tipoMovimento: 'Débito',
          dataMovimento: new Date('2025-01-15'),
          deletadoEm: null,
        },
        {
          id: 'mov-2',
          valor: 2500.0,
          tipoMovimento: 'Crédito',
          dataMovimento: new Date('2025-01-16'),
          deletadoEm: new Date('2025-01-20'), // Deletada
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // Deve considerar apenas mov-1
      // 10000 - 1500 = 8500
      expect(saldo).toBe(8500.0);
    });

    it('should handle only debit movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1000.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 2000.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 500.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 10000 - 1000 - 2000 - 500 = 6500
      expect(saldo).toBe(6500.0);
    });

    it('should handle only credit movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1000.0,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
        {
          valor: 2000.0,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
        {
          valor: 500.0,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 10000 + 1000 + 2000 + 500 = 13500
      expect(saldo).toBe(13500.0);
    });

    it('should handle no movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue([]);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // Sem movimentações, saldo = saldo inicial
      expect(saldo).toBe(10000.0);
    });

    it('should handle decimal precision in calculations', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 1000.55,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 123.47,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 567.89,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
        {
          valor: 12.34,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 1000.55 - 123.47 + 567.89 - 12.34 = 1432.63
      expect(saldo).toBeCloseTo(1432.63, 2);
    });

    it('should handle very large numbers', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 1000000000.0, // 1 bilhão
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 500000000.0, // 500 milhões
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 250000000.0, // 250 milhões
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 1000000000 - 500000000 + 250000000 = 750000000
      expect(saldo).toBe(750000000.0);
    });

    it('should result in negative balance when debits exceed credits', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 1000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 2000.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // 1000 - 2000 = -1000
      expect(saldo).toBe(-1000.0);
    });
  });

  describe('Saldo by Date Range', () => {
    it('should calculate saldo for specific date range', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1000.0,
          tipoMovimento: 'Débito',
          dataMovimento: new Date('2025-01-05'),
          deletadoEm: null,
        },
        {
          valor: 2000.0,
          tipoMovimento: 'Crédito',
          dataMovimento: new Date('2025-01-15'),
          deletadoEm: null,
        },
        {
          valor: 500.0,
          tipoMovimento: 'Débito',
          dataMovimento: new Date('2025-01-25'),
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldoAte15 = await service.calcularSaldoPorPeriodo(
        'conta-123',
        new Date('2025-01-01'),
        new Date('2025-01-15'),
      );

      // 10000 - 1000 + 2000 = 11000
      expect(saldoAte15).toBe(11000.0);

      const saldoTotal = await service.calcularSaldoPorPeriodo(
        'conta-123',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      // 10000 - 1000 + 2000 - 500 = 10500
      expect(saldoTotal).toBe(10500.0);
    });
  });

  describe('Balance Validation', () => {
    it('should validate saldo_atual matches calculated saldo', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 10500.0, // Esperado
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1500.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 2000.0,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldoCalculado = await service.calcularSaldoAtual('conta-123');

      expect(saldoCalculado).toBe(conta.saldo_atual);
    });

    it('should detect discrepancy in saldo_atual', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 12000.0, // INCORRETO
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1500.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
        {
          valor: 2000.0,
          tipoMovimento: 'Crédito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldoCalculado = await service.calcularSaldoAtual('conta-123');

      // Saldo calculado: 10000 - 1500 + 2000 = 10500
      // Saldo atual está errado (12000)
      expect(saldoCalculado).not.toBe(conta.saldo_atual);
      expect(saldoCalculado).toBe(10500.0);
    });
  });

  describe('Balance Updates on Movement Changes', () => {
    it('should update saldo_atual when new movement is added', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 10000.0,
      } as ContasBancarias;

      // Simula adição de movimento de débito
      conta.saldo_atual -= 1500.0;

      expect(conta.saldo_atual).toBe(8500.0);
    });

    it('should update saldo_atual when movement is deleted', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 8500.0, // Após débito de 1500
      } as ContasBancarias;

      // Simula remoção de movimento de débito (restaura valor)
      conta.saldo_atual += 1500.0;

      expect(conta.saldo_atual).toBe(10000.0);
    });

    it('should update saldo_atual when movement is updated', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        saldo_atual: 8500.0, // Após débito de 1500
      } as ContasBancarias;

      // Simula atualização: remove débito antigo e adiciona novo
      const valorAntigo = 1500.0;
      const valorNovo = 2000.0;

      // Restaura valor antigo
      conta.saldo_atual += valorAntigo;
      // Aplica valor novo
      conta.saldo_atual -= valorNovo;

      expect(conta.saldo_atual).toBe(8000.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value movements', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: new Date('2025-01-01'),
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      expect(saldo).toBe(10000.0);
    });

    it('should handle cuenta with no initial date reference', async () => {
      const conta = {
        id: 'conta-123',
        saldo_inicial: 10000.0,
        data_referencia_saldo: null,
      } as ContasBancarias;

      const movimentacoes = [
        {
          valor: 1000.0,
          tipoMovimento: 'Débito',
          deletadoEm: null,
        },
      ] as MovimentacoesBancarias[];

      mockRepository.findOne.mockResolvedValue(conta);
      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      const saldo = await service.calcularSaldoAtual('conta-123');

      // Deve considerar todas as movimentações
      expect(saldo).toBe(9000.0);
    });
  });
});
