import { Test, TestingModule } from '@nestjs/testing';
import { BaixaPagamentoService } from '../../src/baixa-pagamento/baixa-pagamento.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BaixaPagamento } from '../../src/entities/baixa-pagamento/baixa-pagamento.entity';
import { ContasPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('BaixaPagamentoService - Integração Bancária', () => {
  let service: BaixaPagamentoService;
  let mockBaixaRepository: any;
  let mockContaPagarRepository: any;
  let mockContaBancariaRepository: any;
  let mockMovimentacaoRepository: any;
  let mockEntityManager: any;
  let mockAuditService: any;

  beforeEach(async () => {
    mockBaixaRepository = {
      create: jest.fn(),
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
      create: jest.fn(),
      findOne: jest.fn(),
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

  describe('Criação de Movimentação Bancária', () => {
    it('deve criar movimentação bancária do tipo Saída automaticamente', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
        observacao: 'Pagamento via TED',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: 'Saída',
          valor: 800,
          contaBancaria: contaBancaria,
        }),
      );
    });

    it('deve vincular movimentação ao plano de contas da conta a pagar', async () => {
      const planoContas = { id: 'plano-despesas-operacionais' };
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: planoContas,
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          planoContas: planoContas,
        }),
      );
    });

    it('deve incluir empresa na movimentação bancária', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-xyz' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'empresa-xyz',
        }),
      );
    });

    it('deve usar observação customizada na movimentação', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
        observacao: 'Pagamento antecipado com desconto',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: 'Pagamento antecipado com desconto',
        }),
      );
    });

    it('deve gerar descrição automática quando não há observação', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-45678',
        parcela: 2,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: expect.stringContaining('NF-45678'),
        }),
      );

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: expect.stringContaining('Parcela 2'),
        }),
      );
    });
  });

  describe('Vinculação da Movimentação à Baixa', () => {
    it('deve armazenar ID da movimentação na baixa', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      const movimentacaoCriada = { id: 'mov-generated-id' };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue(movimentacaoCriada);
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      const baixaCriada = mockBaixaRepository.create.mock.calls[0][0];
      expect(baixaCriada.movimentacaoBancariaId).toBe('mov-generated-id');
    });
  });

  describe('Persistência em Transação Atômica', () => {
    it('deve persistir baixa, conta a pagar, conta bancária e movimentação separadamente', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      const movimentacaoCriada = { id: 'mov-123' };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue(movimentacaoCriada);
      mockBaixaRepository.create.mockImplementation((data) => data);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      // Verifica que cada repositório persistiu sua entidade
      expect(mockBaixaRepository.persistAndFlush).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(mockContaBancariaRepository.persistAndFlush).toHaveBeenCalledWith(
        contaBancaria,
      );
      expect(mockContaPagarRepository.persistAndFlush).toHaveBeenCalledWith(
        contaPagar,
      );
      expect(mockMovimentacaoRepository.persistAndFlush).toHaveBeenCalledWith(
        movimentacaoCriada,
      );
    });
  });

  describe('Categoria da Movimentação', () => {
    it('deve definir categoria como Pagamento Fornecedor', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoria: 'Pagamento Fornecedor',
        }),
      );
    });
  });

  describe('Data da Movimentação', () => {
    it('deve usar a data da baixa para a movimentação', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);
      mockMovimentacaoRepository.create.mockReturnValue({ id: 'mov-123' });
      mockBaixaRepository.create.mockImplementation((data) => data);
      mockEntityManager.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 800,
        acrescimos: 0,
        descontos: 0,
        data: '2025-02-20',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(mockMovimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: new Date('2025-02-20'),
        }),
      );
    });
  });
});
