import { Test, TestingModule } from '@nestjs/testing';
import { BaixaPagamentoService } from '../../src/baixa-pagamento/baixa-pagamento.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { BaixaPagamento, TipoBaixa } from '../../src/entities/baixa-pagamento/baixa-pagamento.entity';
import { ContasPagar, StatusContaPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { AuditService } from '../../src/audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BaixaPagamentoService - Cálculos', () => {
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
      find: jest.fn(),
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

  describe('Cálculo de Total da Baixa', () => {
    it('deve calcular total = valor + acrescimos - descontos', async () => {
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
        acrescimos: 50, // Juros
        descontos: 30, // Desconto
        data: '2025-01-15',
        observacao: 'Pagamento com juros e desconto',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      const baixaCriada = mockBaixaRepository.create.mock.calls[0][0];
      expect(baixaCriada.total).toBe(820); // 800 + 50 - 30 = 820
    });

    it('deve calcular total correto quando não há acréscimos', async () => {
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
        valor: 900,
        acrescimos: 0,
        descontos: 50,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      const baixaCriada = mockBaixaRepository.create.mock.calls[0][0];
      expect(baixaCriada.total).toBe(850); // 900 + 0 - 50 = 850
    });

    it('deve calcular total correto quando não há descontos', async () => {
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
        valor: 900,
        acrescimos: 100,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      const baixaCriada = mockBaixaRepository.create.mock.calls[0][0];
      expect(baixaCriada.total).toBe(1000); // 900 + 100 - 0 = 1000
    });
  });

  describe('Cálculo de Saldo', () => {
    it('deve atualizar saldo corretamente após baixa parcial', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        valor_total: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
        status: StatusContaPagar.PENDENTE,
        data_liquidacao: undefined,
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
        valor: 400, // Baixa parcial
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(contaPagar.saldo).toBe(600); // 1000 - 400 = 600
      expect(contaPagar.status).toBe(StatusContaPagar.PARCIALMENTE_PAGA);
      expect(contaPagar.data_liquidacao).toBeUndefined();
    });

    it('deve atualizar saldo para zero após baixa total', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        valor_total: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
        status: StatusContaPagar.PENDENTE,
        data_liquidacao: undefined,
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
        valor: 1000, // Baixa total
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      expect(contaPagar.saldo).toBe(0); // 1000 - 1000 = 0
      expect(contaPagar.status).toBe(StatusContaPagar.PAGA);
      expect(contaPagar.data_liquidacao).toBeDefined();
    });

    it('deve atualizar saldo considerando acréscimos e descontos', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        valor_total: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
        status: StatusContaPagar.PENDENTE,
        data_liquidacao: undefined,
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
        valor: 950,
        acrescimos: 100, // Juros
        descontos: 50, // Desconto
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      // Total = 950 + 100 - 50 = 1000
      expect(contaPagar.saldo).toBe(0); // 1000 - 1000 = 0
      expect(contaPagar.status).toBe(StatusContaPagar.PAGA);
    });

    it('deve registrar saldo_anterior e saldo_posterior corretamente', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1500,
        valor_total: 1500,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
        documento: 'NF-123',
        parcela: 1,
        status: StatusContaPagar.PENDENTE,
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
        valor: 600,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      const baixaCriada = mockBaixaRepository.create.mock.calls[0][0];
      expect(baixaCriada.saldo_anterior).toBe(1500);
      expect(baixaCriada.saldo_posterior).toBe(900); // 1500 - 600
    });
  });

  describe('Validações de Baixa', () => {
    it('deve rejeitar baixa se total exceder saldo devedor', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 500,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 600, // Maior que saldo
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await expect(service.create(dto, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar baixa em conta já totalmente paga', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 0, // Já paga
        canceladoEm: null,
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 100,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await expect(service.create(dto, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar baixa em conta cancelada', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: new Date(), // Cancelada
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 5000,
        banco: 'Banco do Brasil',
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 500,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await expect(service.create(dto, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar baixa se saldo bancário insuficiente', async () => {
      const contaPagar = {
        id: 'conta-123',
        saldo: 1000,
        canceladoEm: null,
        empresa: { id: 'empresa-123' },
        planoContas: { id: 'plano-123' },
        pessoa: { id: 'pessoa-123' },
      };

      const contaBancaria = {
        id: 'banco-123',
        saldo_atual: 300, // Insuficiente
      };

      mockContaPagarRepository.findOne.mockResolvedValue(contaPagar);
      mockContaBancariaRepository.findOne.mockResolvedValue(contaBancaria);

      const dto = {
        contaPagarId: 'conta-123',
        contaBancariaId: 'banco-123',
        valor: 500,
        acrescimos: 0,
        descontos: 0,
        data: '2025-01-15',
      };

      await expect(service.create(dto, 'user-123', 'user@test.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Atualização de Saldo Bancário', () => {
    it('deve debitar saldo bancário corretamente', async () => {
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
        acrescimos: 50,
        descontos: 30,
        data: '2025-01-15',
      };

      await service.create(dto, 'user-123', 'user@test.com');

      // Total = 800 + 50 - 30 = 820
      expect(contaBancaria.saldo_atual).toBe(4180); // 5000 - 820
    });
  });
});
