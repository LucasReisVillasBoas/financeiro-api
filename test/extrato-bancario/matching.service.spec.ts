import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { MatchingService } from '../../src/extrato-bancario/matching.service';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';

describe('MatchingService', () => {
  let service: MatchingService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: getRepositoryToken(MovimentacoesBancarias),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encontrarSugestoes', () => {
    const contaBancariaId = 'conta-123';

    it('should return null when no movements found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
        documento: '12345',
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).toBeNull();
    });

    it('should return null when score is below minimum threshold', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-20'), // 5 dias de diferença
        descricao: 'TOTALMENTE DIFERENTE',
        valor: 5000.0, // Valor muito diferente
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).toBeNull();
    });

    it('should return perfect match (100% score)', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.score).toBe(100);
      expect(resultado?.razoes).toContain('Data exata');
      expect(resultado?.razoes).toContain('Valor exato');
      expect(resultado?.razoes).toContain('Descrição idêntica');
    });

    it('should match with 1 day difference', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-16'), // 1 dia depois
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain('Data com 1 dia de diferença');
      expect(resultado?.score).toBeGreaterThan(90);
    });

    it('should match credit transactions', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO CLIENTE',
        valor: 2500.5,
        tipoMovimento: 'Crédito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO CLIENTE',
        valor: 2500.5,
        tipo: 'credito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.score).toBe(100);
    });

    it('should reject incompatible transaction types', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipoMovimento: 'Crédito', // Tipo incompatível
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const, // Débito no extrato
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).toBeNull();
    });

    it('should match "Saída" as debit type', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipoMovimento: 'Saída',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
    });

    it('should match "Entrada" as credit type', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO',
        valor: 1500.0,
        tipoMovimento: 'Entrada',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO',
        valor: 1500.0,
        tipo: 'credito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
    });

    it('should handle near-exact value matches', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.01, // Diferença de 0.01
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain(
        expect.stringContaining('Valor quase exato'),
      );
    });

    it('should match when one description contains the other', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC LTDA',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain('Descrição contém a outra');
    });

    it('should normalize text for comparison (remove accents, lowercase)', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ACENTUAÇÃO',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'pagamento fornecedor acentuacao', // Sem acentos, minúsculas
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain('Descrição idêntica');
    });

    it('should calculate word similarity correctly', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC MATERIAIS LTDA',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR ABC',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      // "PAGAMENTO", "FORNECEDOR", "ABC" são comuns (3 de 5 palavras)
      expect(resultado?.razoes.some((r) => r.includes('similar'))).toBe(true);
    });

    it('should select best match from multiple candidates', async () => {
      const movimentacoes = [
        {
          id: 'mov-1',
          dataMovimento: new Date('2025-01-15'),
          descricao: 'PAGAMENTO FORNECEDOR',
          valor: 1500.0,
          tipoMovimento: 'Débito',
        },
        {
          id: 'mov-2',
          dataMovimento: new Date('2025-01-15'),
          descricao: 'OUTRO PAGAMENTO',
          valor: 1500.0,
          tipoMovimento: 'Débito',
        },
        {
          id: 'mov-3',
          dataMovimento: new Date('2025-01-15'),
          descricao: 'PAGAMENTO',
          valor: 1500.0,
          tipoMovimento: 'Débito',
        },
      ] as MovimentacoesBancarias[];

      mockRepository.find.mockResolvedValue(movimentacoes);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      // Deve escolher mov-1 (melhor match)
      expect(resultado?.movimentacaoId).toBe('mov-1');
      expect(resultado?.score).toBe(100);
    });

    it('should search within ±7 days window', async () => {
      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      await service.encontrarSugestoes(transacao, contaBancariaId);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          contaBancaria: contaBancariaId,
          conciliado: 'N',
          dataMovimento: {
            $gte: new Date('2025-01-08'), // -7 dias
            $lte: new Date('2025-01-22'), // +7 dias
          },
          deletadoEm: null,
        }),
      );
    });

    it('should return detailed movement information', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado?.movimentacao).toMatchObject({
        id: 'mov-1',
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipo: 'Débito',
      });
    });

    it('should handle edge case: 7 days difference (boundary)', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-22'), // Exatamente 7 dias depois
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain(
        expect.stringContaining('7 dias de diferença'),
      );
    });

    it('should handle value difference of exactly 1%', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1515.0, // 1% a mais de 1500
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.razoes).toContain(
        expect.stringContaining('muito próximo'),
      );
    });

    it('should reject when value difference exceeds 10%', async () => {
      const movimentacao = {
        id: 'mov-1',
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 2000.0, // ~33% diferença
        tipoMovimento: 'Débito',
      } as MovimentacoesBancarias;

      mockRepository.find.mockResolvedValue([movimentacao]);

      const transacao = {
        data: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipo: 'debito' as const,
      };

      const resultado = await service.encontrarSugestoes(
        transacao,
        contaBancariaId,
      );

      expect(resultado).toBeNull();
    });
  });
});
