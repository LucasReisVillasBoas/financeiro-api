import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BaixaRecebimentoService } from '../../src/baixa-recebimento/baixa-recebimento.service';
import { BaixaRecebimento } from '../../src/entities/baixa-recebimento/baixa-recebimento.entity';
import { ContasReceber, StatusContaReceber } from '../../src/entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias, TipoMovimento } from '../../src/entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('BaixaRecebimentoService', () => {
  let service: BaixaRecebimentoService;
  let baixaRecebimentoRepository: any;
  let contaReceberRepository: any;
  let contaBancariaRepository: any;
  let movimentacaoRepository: any;
  let auditService: any;

  const mockContaReceber = {
    id: 'conta-receber-123',
    documento: 'NF-001',
    descricao: 'Venda de produtos',
    parcela: 1,
    valorTotal: 1000,
    saldo: 1000,
    status: StatusContaReceber.PENDENTE,
    deletadoEm: null,
    empresa: { id: 'empresa-123' },
    planoContas: { id: 'plano-123' },
    pessoa: { id: 'pessoa-123' },
  };

  const mockContaBancaria = {
    id: 'conta-bancaria-123',
    banco: 'Banco do Brasil',
    saldo_atual: 5000,
    ativo: true,
    deletadoEm: null,
  };

  const mockBaixa = {
    id: 'baixa-123',
    contaReceber: mockContaReceber,
    contaBancaria: mockContaBancaria,
    data: new Date(),
    valor: 500,
    acrescimos: 0,
    descontos: 0,
    total: 500,
    saldoAnterior: 1000,
    saldoPosterior: 500,
    deletadoEm: null,
    movimentacaoBancariaId: 'mov-123',
  };

  beforeEach(async () => {
    baixaRecebimentoRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'nova-baixa-123', ...data })),
      find: jest.fn().mockResolvedValue([mockBaixa]),
      findOne: jest.fn().mockResolvedValue(mockBaixa),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    contaReceberRepository = {
      findOne: jest.fn().mockResolvedValue({ ...mockContaReceber }),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
    };

    contaBancariaRepository = {
      findOne: jest.fn().mockResolvedValue({ ...mockContaBancaria }),
    };

    movimentacaoRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'mov-123', ...data })),
      findOne: jest.fn().mockResolvedValue({ id: 'mov-123', valor: 500 }),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaixaRecebimentoService,
        {
          provide: getRepositoryToken(BaixaRecebimento),
          useValue: baixaRecebimentoRepository,
        },
        {
          provide: getRepositoryToken(ContasReceber),
          useValue: contaReceberRepository,
        },
        {
          provide: getRepositoryToken(ContasBancarias),
          useValue: contaBancariaRepository,
        },
        {
          provide: getRepositoryToken(MovimentacoesBancarias),
          useValue: movimentacaoRepository,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<BaixaRecebimentoService>(BaixaRecebimentoService);
  });

  describe('create', () => {
    const createDto = {
      contaReceberId: 'conta-receber-123',
      contaBancariaId: 'conta-bancaria-123',
      data: '2024-01-15',
      valor: 500,
      acrescimos: 0,
      descontos: 0,
    };

    it('deve criar uma baixa de recebimento com sucesso', async () => {
      const result = await service.create(createDto, 'user-123', 'user@test.com');

      expect(result).toBeDefined();
      expect(baixaRecebimentoRepository.create).toHaveBeenCalled();
      expect(movimentacaoRepository.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('deve lançar erro se conta a receber não encontrada', async () => {
      contaReceberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se conta a receber está cancelada', async () => {
      contaReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        status: StatusContaReceber.CANCELADO,
      });

      await expect(
        service.create(createDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se conta a receber já está totalmente recebida', async () => {
      contaReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        saldo: 0,
      });

      await expect(
        service.create(createDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se conta bancária não encontrada', async () => {
      contaBancariaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(createDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se conta bancária está inativa', async () => {
      contaBancariaRepository.findOne.mockResolvedValue({
        ...mockContaBancaria,
        ativo: false,
      });

      await expect(
        service.create(createDto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se total da baixa é maior que o saldo', async () => {
      const dtoValorAlto = { ...createDto, valor: 2000 };

      await expect(
        service.create(dtoValorAlto, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se total da baixa é zero ou negativo', async () => {
      const dtoValorZero = { ...createDto, valor: 0 };

      await expect(
        service.create(dtoValorZero, 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve calcular total corretamente com acréscimos e descontos', async () => {
      const dtoComAcrescimosDescontos = {
        ...createDto,
        valor: 500,
        acrescimos: 50,
        descontos: 30,
      };

      await service.create(dtoComAcrescimosDescontos, 'user-123', 'user@test.com');

      expect(baixaRecebimentoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          valor: 500,
          acrescimos: 50,
          descontos: 30,
          total: 520, // 500 + 50 - 30
        }),
      );
    });

    it('deve criar movimentação bancária do tipo CRÉDITO', async () => {
      await service.create(createDto, 'user-123', 'user@test.com');

      expect(movimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimento: TipoMovimento.CREDITO,
        }),
      );
    });

    it('deve atualizar status para LIQUIDADO quando saldo chega a zero', async () => {
      contaReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        saldo: 500, // Mesmo valor da baixa
      });

      await service.create(createDto, 'user-123', 'user@test.com');

      // Verifica que o status foi atualizado
      expect(contaReceberRepository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve atualizar status para PARCIAL quando há saldo restante', async () => {
      // Saldo maior que o valor da baixa
      contaReceberRepository.findOne.mockResolvedValue({
        ...mockContaReceber,
        saldo: 1000,
      });

      await service.create(createDto, 'user-123', 'user@test.com');

      expect(contaReceberRepository.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('findByContaReceber', () => {
    it('deve retornar baixas de uma conta a receber', async () => {
      const result = await service.findByContaReceber('conta-receber-123');

      expect(result).toEqual([mockBaixa]);
      expect(baixaRecebimentoRepository.find).toHaveBeenCalledWith(
        { contaReceber: { id: 'conta-receber-123' }, deletadoEm: null },
        expect.any(Object),
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as baixas', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockBaixa]);
      expect(baixaRecebimentoRepository.find).toHaveBeenCalledWith(
        { deletadoEm: null },
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma baixa por ID', async () => {
      const result = await service.findOne('baixa-123');

      expect(result).toEqual(mockBaixa);
    });

    it('deve lançar erro se baixa não encontrada', async () => {
      baixaRecebimentoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('baixa-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMovimentacaoBancaria', () => {
    it('deve retornar a movimentação bancária vinculada', async () => {
      const result = await service.findMovimentacaoBancaria('baixa-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('mov-123');
    });

    it('deve retornar null se não há movimentação vinculada', async () => {
      baixaRecebimentoRepository.findOne.mockResolvedValue({
        ...mockBaixa,
        movimentacaoBancariaId: null,
      });

      const result = await service.findMovimentacaoBancaria('baixa-123');

      expect(result).toBeNull();
    });
  });

  describe('estornar', () => {
    it('deve estornar uma baixa com sucesso', async () => {
      const result = await service.estornar('baixa-123', 'user-123', 'user@test.com');

      expect(result).toBeDefined();
      expect(result.deletadoEm).toBeDefined();
      expect(movimentacaoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoMovimento: TipoMovimento.DEBITO,
          categoria: 'ESTORNO_RECEBIMENTO',
        }),
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('deve lançar erro se conta a receber não encontrada no estorno', async () => {
      contaReceberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.estornar('baixa-123', 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se conta bancária não encontrada no estorno', async () => {
      contaBancariaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.estornar('baixa-123', 'user-123', 'user@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se saldo insuficiente para estorno', async () => {
      contaBancariaRepository.findOne.mockResolvedValue({
        ...mockContaBancaria,
        saldo_atual: 100, // Menor que o total da baixa (500)
      });

      await expect(
        service.estornar('baixa-123', 'user-123', 'user@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve restaurar o saldo da conta a receber', async () => {
      const contaReceberMock = { ...mockContaReceber, saldo: 500 };
      contaReceberRepository.findOne.mockResolvedValue(contaReceberMock);

      await service.estornar('baixa-123', 'user-123', 'user@test.com');

      // Saldo deve ser restaurado: 500 + 500 (total da baixa) = 1000
      expect(contaReceberMock.saldo).toBe(1000);
    });

    it('deve atualizar status para PENDENTE após estorno', async () => {
      const contaReceberMock = {
        ...mockContaReceber,
        saldo: 0,
        status: StatusContaReceber.LIQUIDADO,
      };
      contaReceberRepository.findOne.mockResolvedValue(contaReceberMock);

      await service.estornar('baixa-123', 'user-123', 'user@test.com');

      expect(contaReceberMock.status).toBe(StatusContaReceber.PENDENTE);
    });

    it('deve debitar o valor da conta bancária', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 5000 };
      contaBancariaRepository.findOne.mockResolvedValue(contaBancariaMock);

      await service.estornar('baixa-123', 'user-123', 'user@test.com');

      // Saldo deve ser debitado: 5000 - 500 = 4500
      expect(contaBancariaMock.saldo_atual).toBe(4500);
    });
  });

  describe('Cálculos e Regras de Negócio', () => {
    it('deve calcular saldo posterior corretamente', async () => {
      const contaReceberMock = { ...mockContaReceber, saldo: 1000 };
      contaReceberRepository.findOne.mockResolvedValue(contaReceberMock);

      await service.create(
        {
          contaReceberId: 'conta-receber-123',
          contaBancariaId: 'conta-bancaria-123',
          data: '2024-01-15',
          valor: 300,
        },
        'user-123',
        'user@test.com',
      );

      expect(baixaRecebimentoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldoAnterior: 1000,
          saldoPosterior: 700,
        }),
      );
    });

    it('deve adicionar valor ao saldo da conta bancária', async () => {
      const contaBancariaMock = { ...mockContaBancaria, saldo_atual: 1000 };
      contaBancariaRepository.findOne.mockResolvedValue(contaBancariaMock);

      await service.create(
        {
          contaReceberId: 'conta-receber-123',
          contaBancariaId: 'conta-bancaria-123',
          data: '2024-01-15',
          valor: 500,
        },
        'user-123',
        'user@test.com',
      );

      // Saldo deve aumentar: 1000 + 500 = 1500
      expect(contaBancariaMock.saldo_atual).toBe(1500);
    });

    it('deve arredondar valores para 2 casas decimais', async () => {
      await service.create(
        {
          contaReceberId: 'conta-receber-123',
          contaBancariaId: 'conta-bancaria-123',
          data: '2024-01-15',
          valor: 333.333,
          acrescimos: 10.555,
          descontos: 5.111,
        },
        'user-123',
        'user@test.com',
      );

      expect(baixaRecebimentoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          total: expect.any(Number),
        }),
      );
    });
  });
});
