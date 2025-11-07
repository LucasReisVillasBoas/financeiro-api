import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MovimentacoesBancariasService } from '../../src/movimentacao-bancaria/movimentacao-bancaria.service';
import { MovimentacoesBancarias } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('MovimentacoesBancariasService', () => {
  let service: MovimentacoesBancariasService;
  let mockMovimentacaoRepository: any;
  let mockContaBancariaRepository: any;
  let mockAuditService: any;

  const userId = 'user-123';
  const userEmail = 'user@test.com';
  const empresaId = 'empresa-123';

  beforeEach(async () => {
    mockMovimentacaoRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getEntityManager: jest.fn(() => ({
        persistAndFlush: jest.fn(),
        removeAndFlush: jest.fn(),
        flush: jest.fn(),
      })),
    };

    mockContaBancariaRepository = {
      findOne: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimentacoesBancariasService,
        {
          provide: 'MovimentacoesBancariasRepository',
          useValue: mockMovimentacaoRepository,
        },
        {
          provide: 'ContasBancariasRepository',
          useValue: mockContaBancariaRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<MovimentacoesBancariasService>(
      MovimentacoesBancariasService,
    );
  });

  describe('create - Manual Creation', () => {
    const contaBancaria = {
      id: 'conta-123',
      descricao: 'Conta Corrente',
      saldo_atual: 10000.0,
    } as ContasBancarias;

    it('should create manual debit movement and update balance', async () => {
      const dto = {
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO MANUAL',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        contaBancariaId: 'conta-123',
        empresaId,
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      await service.create(dto, userId, userEmail);

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referencia: 'Manual',
          conciliado: 'N',
        }),
      );

      // Saldo deve ser reduzido
      expect(contaBancaria.saldo_atual).toBe(8500.0);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should create manual credit movement and update balance', async () => {
      const dto = {
        dataMovimento: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO MANUAL',
        valor: 2500.0,
        tipoMovimento: 'Crédito',
        contaBancariaId: 'conta-123',
        empresaId,
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      await service.create(dto, userId, userEmail);

      // Saldo deve ser aumentado
      expect(contaBancaria.saldo_atual).toBe(12500.0);
    });

    it('should throw NotFoundException when conta bancaria not found', async () => {
      const dto = {
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        contaBancariaId: 'invalid-id',
        empresaId,
      };

      mockContaBancariaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, userId, userEmail)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('conciliar - Manual Reconciliation', () => {
    it('should reconcile multiple movements manually', async () => {
      const movimentacoes = [
        {
          id: 'mov-1',
          conciliado: 'N',
          empresaId,
        } as MovimentacoesBancarias,
        {
          id: 'mov-2',
          conciliado: 'N',
          empresaId,
        } as MovimentacoesBancarias,
      ];

      mockMovimentacaoRepository.findOne
        .mockResolvedValueOnce(movimentacoes[0])
        .mockResolvedValueOnce(movimentacoes[1]);

      const dto = {
        movimentacaoIds: ['mov-1', 'mov-2'],
      };

      const result = await service.conciliar(dto, userId, userEmail);

      expect(result.conciliadas).toBe(2);
      expect(result.erros).toHaveLength(0);
      expect(movimentacoes[0].conciliado).toBe('S');
      expect(movimentacoes[0].conciliadoPor).toBe(userId);
      expect(movimentacoes[1].conciliado).toBe('S');
      expect(movimentacoes[1].conciliadoPor).toBe(userId);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should skip already reconciled movements', async () => {
      const movimentacoes = [
        {
          id: 'mov-1',
          conciliado: 'S', // Já conciliada
          empresaId,
        } as MovimentacoesBancarias,
        {
          id: 'mov-2',
          conciliado: 'N',
          empresaId,
        } as MovimentacoesBancarias,
      ];

      mockMovimentacaoRepository.findOne
        .mockResolvedValueOnce(movimentacoes[0])
        .mockResolvedValueOnce(movimentacoes[1]);

      const dto = {
        movimentacaoIds: ['mov-1', 'mov-2'],
      };

      const result = await service.conciliar(dto, userId, userEmail);

      expect(result.conciliadas).toBe(1); // Apenas mov-2
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toContain('já está conciliada');
    });

    it('should handle not found movements', async () => {
      mockMovimentacaoRepository.findOne.mockResolvedValue(null);

      const dto = {
        movimentacaoIds: ['invalid-id'],
      };

      const result = await service.conciliar(dto, userId, userEmail);

      expect(result.conciliadas).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toContain('não encontrada');
    });
  });

  describe('desconciliar - Undo Reconciliation', () => {
    it('should unreconcile movements', async () => {
      const movimentacoes = [
        {
          id: 'mov-1',
          conciliado: 'S',
          conciliadoPor: userId,
          conciliadoEm: new Date(),
          empresaId,
        } as MovimentacoesBancarias,
      ];

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacoes[0]);

      const dto = {
        movimentacaoIds: ['mov-1'],
      };

      const result = await service.desconciliar(dto, userId, userEmail);

      expect(result.desconciliadas).toBe(1);
      expect(result.erros).toHaveLength(0);
      expect(movimentacoes[0].conciliado).toBe('N');
      expect(movimentacoes[0].conciliadoPor).toBeUndefined();
      expect(movimentacoes[0].conciliadoEm).toBeUndefined();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should skip not reconciled movements', async () => {
      const movimentacao = {
        id: 'mov-1',
        conciliado: 'N', // Não conciliada
        empresaId,
      } as MovimentacoesBancarias;

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      const dto = {
        movimentacaoIds: ['mov-1'],
      };

      const result = await service.desconciliar(dto, userId, userEmail);

      expect(result.desconciliadas).toBe(0);
      expect(result.erros).toHaveLength(1);
      expect(result.erros[0]).toContain('não está conciliada');
    });
  });

  describe('findAll with filters', () => {
    it('should filter by conciliation status', async () => {
      const movimentacoes = [
        { id: 'mov-1', conciliado: 'S' },
        { id: 'mov-2', conciliado: 'N' },
      ] as MovimentacoesBancarias[];

      mockMovimentacaoRepository.find.mockResolvedValue(movimentacoes);

      await service.findAll({ conciliado: 'S' });

      expect(mockMovimentacaoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          conciliado: 'S',
        }),
        expect.any(Object),
      );
    });

    it('should filter by date range', async () => {
      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-01-31');

      mockMovimentacaoRepository.find.mockResolvedValue([]);

      await service.findAll({ dataInicio, dataFim });

      expect(mockMovimentacaoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          dataMovimento: {
            $gte: dataInicio,
            $lte: dataFim,
          },
        }),
        expect.any(Object),
      );
    });

    it('should filter by conta bancaria', async () => {
      const contaBancariaId = 'conta-123';

      mockMovimentacaoRepository.find.mockResolvedValue([]);

      await service.findAll({ contaBancariaId });

      expect(mockMovimentacaoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          contaBancaria: contaBancariaId,
        }),
        expect.any(Object),
      );
    });

    it('should filter by empresa', async () => {
      mockMovimentacaoRepository.find.mockResolvedValue([]);

      await service.findAll({ empresaId });

      expect(mockMovimentacaoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId,
        }),
        expect.any(Object),
      );
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete movement and restore balance', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 8500.0, // Saldo após débito de 1500
      } as ContasBancarias;

      const movimentacao = {
        id: 'mov-1',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        contaBancaria,
        deletadoEm: null,
        empresaId,
      } as MovimentacoesBancarias;

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.remove('mov-1', userId, userEmail);

      expect(movimentacao.deletadoEm).toBeDefined();
      // Saldo deve ser restaurado (soma o débito de volta)
      expect(contaBancaria.saldo_atual).toBe(10000.0);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when movement not found', async () => {
      mockMovimentacaoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('invalid-id', userId, userEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already deleted', async () => {
      const movimentacao = {
        id: 'mov-1',
        deletadoEm: new Date(),
      } as MovimentacoesBancarias;

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await expect(
        service.remove('mov-1', userId, userEmail),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Balance Calculations', () => {
    it('should calculate correct balance for multiple debit movements', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 10000.0,
      } as ContasBancarias;

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      // Débito 1
      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'DEBITO 1',
          valor: 1000.0,
          tipoMovimento: 'Débito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      expect(contaBancaria.saldo_atual).toBe(9000.0);

      // Débito 2
      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'DEBITO 2',
          valor: 500.0,
          tipoMovimento: 'Débito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      expect(contaBancaria.saldo_atual).toBe(8500.0);
    });

    it('should calculate correct balance for mixed movements', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 10000.0,
      } as ContasBancarias;

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      // Débito 1500
      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'DEBITO',
          valor: 1500.0,
          tipoMovimento: 'Débito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      expect(contaBancaria.saldo_atual).toBe(8500.0);

      // Crédito 3000
      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'CREDITO',
          valor: 3000.0,
          tipoMovimento: 'Crédito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      expect(contaBancaria.saldo_atual).toBe(11500.0);

      // Débito 500
      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'DEBITO 2',
          valor: 500.0,
          tipoMovimento: 'Débito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      expect(contaBancaria.saldo_atual).toBe(11000.0);
    });

    it('should restore correct balance when deleting movements', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 8500.0, // Após débito de 1500
      } as ContasBancarias;

      const movimentacaoDebito = {
        id: 'mov-1',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        contaBancaria,
        deletadoEm: null,
        empresaId,
      } as MovimentacoesBancarias;

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacaoDebito);

      await service.remove('mov-1', userId, userEmail);

      // Restaura débito: 8500 + 1500 = 10000
      expect(contaBancaria.saldo_atual).toBe(10000.0);

      // Agora testa restaurar crédito
      const movimentacaoCredito = {
        id: 'mov-2',
        valor: 2000.0,
        tipoMovimento: 'Crédito',
        contaBancaria,
        deletadoEm: null,
        empresaId,
      } as MovimentacoesBancarias;

      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacaoCredito);

      await service.remove('mov-2', userId, userEmail);

      // Restaura crédito: 10000 - 2000 = 8000
      expect(contaBancaria.saldo_atual).toBe(8000.0);
    });

    it('should handle decimal precision correctly', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 1000.55,
      } as ContasBancarias;

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      await service.create(
        {
          dataMovimento: new Date(),
          descricao: 'TESTE DECIMAIS',
          valor: 123.47,
          tipoMovimento: 'Débito',
          contaBancariaId: 'conta-123',
          empresaId,
        },
        userId,
        userEmail,
      );

      // 1000.55 - 123.47 = 877.08
      expect(contaBancaria.saldo_atual).toBeCloseTo(877.08, 2);
    });
  });

  describe('Integration with Contas Pagar/Receber', () => {
    it('should create movement from conta a pagar with referencia', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 10000.0,
      } as ContasBancarias;

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      const dto = {
        dataMovimento: new Date('2025-01-15'),
        descricao: 'PAGAMENTO FORNECEDOR',
        valor: 1500.0,
        tipoMovimento: 'Débito',
        contaBancariaId: 'conta-123',
        empresaId,
        referencia: 'Pagar',
        referenciaId: 'conta-pagar-123',
      };

      await service.create(dto, userId, userEmail);

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referencia: 'Pagar',
          referenciaId: 'conta-pagar-123',
        }),
      );
    });

    it('should create movement from conta a receber with referencia', async () => {
      const contaBancaria = {
        id: 'conta-123',
        saldo_atual: 10000.0,
      } as ContasBancarias;

      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockImplementation((data) => data);

      const dto = {
        dataMovimento: new Date('2025-01-15'),
        descricao: 'RECEBIMENTO CLIENTE',
        valor: 2500.0,
        tipoMovimento: 'Crédito',
        contaBancariaId: 'conta-123',
        empresaId,
        referencia: 'Receber',
        referenciaId: 'conta-receber-123',
      };

      await service.create(dto, userId, userEmail);

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          referencia: 'Receber',
          referenciaId: 'conta-receber-123',
        }),
      );
    });
  });
});
