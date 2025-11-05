import { Test, TestingModule } from '@nestjs/testing';
import { BaixaPagamentoService } from '../../src/baixa-pagamento/baixa-pagamento.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BaixaPagamento } from '../../src/entities/baixa-pagamento/baixa-pagamento.entity';
import { ContasPagar, StatusContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('BaixaPagamentoService - Estorno', () => {
  let service: BaixaPagamentoService;
  let mockBaixaRepository: any;
  let mockContaPagarRepository: any;
  let mockContaBancariaRepository: any;
  let mockMovimentacaoRepository: any;
  let mockEntityManager: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockBaixaRepository = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockContaPagarRepository = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockContaBancariaRepository = {
      findOne: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    mockMovimentacaoRepository = {
      findOne: jest.fn(),
      create: jest.fn((data) => ({ ...data, id: 'new-mov-id' })),
      persistAndFlush: jest.fn(),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaixaPagamentoService,
        {
          provide: getRepositoryToken(BaixaPagamento),
          useValue: mockBaixaRepository,
        },
        {
          provide: getRepositoryToken(ContasPagar),
          useValue: mockContaPagarRepository,
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

    service = module.get<BaixaPagamentoService>(BaixaPagamentoService);
  });

  describe('Estorno de Baixa Parcial', () => {
    it('deve reverter saldo da conta a pagar corretamente', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        status: StatusContaPagar.PARCIALMENTE_PAGA,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
        data_liquidacao: undefined,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Saldo restaurado
      expect(contaPagar.saldo).toBe(1000); // 500 + 500
      expect(contaPagar.status).toBe(StatusContaPagar.PENDENTE);
      expect(contaPagar.data_liquidacao).toBeUndefined();
    });

    it('deve reverter saldo bancário corretamente', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 750,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 250,
        valor_total: 1000,
        status: StatusContaPagar.PARCIALMENTE_PAGA,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 2250,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Saldo bancário restaurado
      expect(contaBancaria.saldo_atual).toBe(3000); // 2250 + 750
    });

    it('deve manter movimentação original no histórico (não deletar)', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Movimentação original NÃO deve ser buscada ou modificada
      expect(mockMovimentacaoRepository.findOne).not.toHaveBeenCalled();
    });

    it('deve criar movimentação de entrada para registrar o estorno', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Deve criar movimentação de entrada
      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Entrada',
          valor: 500,
          categoria: 'Estorno de Pagamento',
          descricao: expect.stringContaining('Estorno'),
        }),
      );
    });

    it('deve marcar baixa como deletada', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
        deletadoEm: null,
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Baixa marcada como deletada
      expect(baixa.deletadoEm).toBeDefined();
      expect(baixa.deletadoEm).toBeInstanceOf(Date);
    });
  });

  describe('Estorno de Baixa Total', () => {
    it('deve voltar status para PENDENTE quando era PAGA', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 1000,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 0,
        valor_total: 1000,
        status: StatusContaPagar.PAGA,
        data_liquidacao: new Date('2025-01-15'),
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 4000,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      expect(contaPagar.saldo).toBe(1000); // 0 + 1000
      expect(contaPagar.status).toBe(StatusContaPagar.PENDENTE);
      expect(contaPagar.data_liquidacao).toBeUndefined();
    });

    it('deve voltar status para PARCIALMENTE_PAGA quando ainda há baixas anteriores', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 0,
        valor_total: 1000,
        status: StatusContaPagar.PAGA,
        data_liquidacao: new Date('2025-01-15'),
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 4000,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      expect(contaPagar.saldo).toBe(500); // 0 + 500
      expect(contaPagar.status).toBe(StatusContaPagar.PARCIALMENTE_PAGA);
      // data_liquidacao deve ser removida se saldo = valor_total
      // mas nesse caso saldo != valor_total, então pode permanecer
    });
  });

  describe('Auditoria de Estorno', () => {
    it('deve registrar estorno em auditoria com severity CRITICAL', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      const justificativa = 'Pagamento realizado em duplicidade';
      await service.estornar('baixa-123', justificativa, 'user-123', 'user@test.com');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'CRITICAL',
          action: 'ESTORNAR_BAIXA',
          userId: 'user-123',
          userEmail: 'user@test.com',
          details: expect.objectContaining({
            justificativa,
            valorEstornado: 500,
            baixaId: 'baixa-123',
            contaPagarId: 'conta-123',
          }),
        }),
      );
    });

    it('deve incluir justificativa na auditoria', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      const movimentacao = {
        id: 'mov-123',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.findOne.mockResolvedValue(movimentacao);

      const justificativa = 'Erro no valor do pagamento';
      await service.estornar('baixa-123', justificativa, 'user-123', 'user@test.com');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            justificativa: 'Erro no valor do pagamento',
          }),
        }),
      );
    });
  });

  describe('Transação Atômica no Estorno', () => {
    it('deve persistir todas as entidades incluindo movimentação de estorno', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: 'mov-123',
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Deve ter persistido baixa, conta a pagar, conta bancária
      expect(mockBaixaRepository.persistAndFlush).toHaveBeenCalledWith(baixa);
      expect(mockContaPagarRepository.persistAndFlush).toHaveBeenCalledWith(contaPagar);
      expect(mockContaBancariaRepository.persistAndFlush).toHaveBeenCalledWith(contaBancaria);

      // Deve ter persistido apenas a movimentação de estorno (entrada)
      expect(mockMovimentacaoRepository.persistAndFlush).toHaveBeenCalledTimes(1);
    });

    it('deve criar movimentação de estorno mesmo sem movimentação bancária original', async () => {
      const baixa = {
        id: 'baixa-123',
        total: 500,
        movimentacaoBancariaId: null,
        contaPagar: { id: 'conta-123', empresa: { id: 'empresa-123' }, documento: 'NF-123', parcela: 1 },
        contaBancaria: { id: 'banco-123', banco: 'Banco Teste' },
      };

      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        valor_total: 1000,
        empresa: { id: 'empresa-123' },
        documento: 'NF-123',
        parcela: 1,
        planoContas: { id: 'plano-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 3500,
        banco: 'Banco Teste',
      };

      mockBaixaRepository.findOne.mockResolvedValue(baixa);
      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      await service.estornar('baixa-123', 'Estorno de teste', 'user-123', 'user@test.com');

      // Deve persistir baixa, conta a pagar, conta bancária e movimentação de estorno
      expect(mockBaixaRepository.persistAndFlush).toHaveBeenCalledWith(baixa);
      expect(mockContaPagarRepository.persistAndFlush).toHaveBeenCalledWith(contaPagar);
      expect(mockContaBancariaRepository.persistAndFlush).toHaveBeenCalledWith(contaBancaria);

      // Deve ter criado e persistido a movimentação de estorno
      expect(mockMovimentacaoRepository.create).toHaveBeenCalled();
      expect(mockMovimentacaoRepository.persistAndFlush).toHaveBeenCalled();
    });
  });
});
