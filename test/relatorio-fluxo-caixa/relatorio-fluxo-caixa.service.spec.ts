import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { RelatorioFluxoCaixaService } from '../../src/relatorio-fluxo-caixa/relatorio-fluxo-caixa.service';
import { ContasPagar } from '../../src/entities/conta-pagar/conta-pagar.entity';
import { ContasReceber } from '../../src/entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { Empresa } from '../../src/entities/empresa/empresa.entity';
import { FluxoCaixaFiltrosDto } from '../../src/relatorio-fluxo-caixa/dto/fluxo-caixa.dto';

describe('RelatorioFluxoCaixaService', () => {
  let service: RelatorioFluxoCaixaService;
  let contasPagarRepository: any;
  let contasReceberRepository: any;
  let contaBancariaRepository: any;
  let empresaRepository: any;
  let entityManager: EntityManager;

  const mockEmpresa = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    razao_social: 'Empresa Teste Ltda',
    nome_fantasia: 'Empresa Teste',
  };

  const mockContaBancaria = {
    id: 'conta-bancaria-1',
    banco: '001',
    agencia: '1234',
    conta: '56789',
    descricao: 'Conta Principal',
    saldo_inicial: 10000,
  };

  const mockPessoa = {
    id: 'pessoa-1',
    fantasiaApelido: 'Fornecedor Teste',
  };

  beforeEach(async () => {
    const mockContasPagarRepository = {
      find: jest.fn(),
    };

    const mockContasReceberRepository = {
      find: jest.fn(),
    };

    const mockContaBancariaRepository = {
      findOne: jest.fn(),
    };

    const mockEmpresaRepository = {
      findOne: jest.fn(),
    };

    const mockEntityManager = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatorioFluxoCaixaService,
        {
          provide: getRepositoryToken(ContasPagar),
          useValue: mockContasPagarRepository,
        },
        {
          provide: getRepositoryToken(ContasReceber),
          useValue: mockContasReceberRepository,
        },
        {
          provide: getRepositoryToken(ContasBancarias),
          useValue: mockContaBancariaRepository,
        },
        {
          provide: getRepositoryToken(Empresa),
          useValue: mockEmpresaRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<RelatorioFluxoCaixaService>(
      RelatorioFluxoCaixaService,
    );
    contasPagarRepository = module.get(getRepositoryToken(ContasPagar));
    contasReceberRepository = module.get(getRepositoryToken(ContasReceber));
    contaBancariaRepository = module.get(getRepositoryToken(ContasBancarias));
    empresaRepository = module.get(getRepositoryToken(Empresa));
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validações de cálculo - Saldo Diário', () => {
    it('deve calcular saldo diário realizado = entradas - saídas', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-03',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      // Conta a receber liquidada (entrada realizada)
      const contaReceber = {
        id: 'receber-1',
        descricao: 'Venda',
        valorTotal: 5000,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-02'),
        vencimento: new Date('2025-01-02'),
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      // Conta a pagar liquidada (saída realizada)
      const contaPagar = {
        id: 'pagar-1',
        descricao: 'Fornecedor',
        valor_total: 2000,
        saldo: 0,
        status: 'Liquidada',
        data_liquidacao: new Date('2025-01-02'),
        vencimento: new Date('2025-01-02'),
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([contaReceber]);
      contasPagarRepository.find.mockResolvedValue([contaPagar]);

      const result = await service.gerarRelatorio(filtros);

      // Encontrar linha do dia 2025-01-02
      const linha = result.linhas.find((l) => l.data === '2025-01-02');

      expect(linha).toBeDefined();
      expect(linha.entradasRealizadas).toBe(5000);
      expect(linha.saidasRealizadas).toBe(2000);

      // Saldo Diário Realizado = Entradas - Saídas = 5000 - 2000 = 3000
      expect(linha.saldoDiarioRealizado).toBe(3000);
    });

    it('deve calcular saldo diário previsto = entradas previstas - saídas previstas', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-03',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      // Conta a receber pendente (entrada prevista)
      const contaReceber = {
        id: 'receber-1',
        descricao: 'Venda',
        valorTotal: 8000,
        saldo: 8000,
        status: 'PENDENTE',
        dataLiquidacao: null,
        vencimento: new Date('2025-01-02'),
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      // Conta a pagar pendente (saída prevista)
      const contaPagar = {
        id: 'pagar-1',
        descricao: 'Fornecedor',
        valor_total: 3500,
        saldo: 3500,
        status: 'Pendente',
        data_liquidacao: null,
        vencimento: new Date('2025-01-02'),
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([contaReceber]);
      contasPagarRepository.find.mockResolvedValue([contaPagar]);

      const result = await service.gerarRelatorio(filtros);

      const linha = result.linhas.find((l) => l.data === '2025-01-02');

      expect(linha).toBeDefined();
      expect(linha.entradasPrevistas).toBe(8000);
      expect(linha.saidasPrevistas).toBe(3500);

      // Saldo Diário Previsto = Entradas Previstas - Saídas Previstas = 8000 - 3500 = 4500
      expect(linha.saldoDiarioPrevisto).toBe(4500);
    });

    it('deve calcular saldo diário negativo quando saídas > entradas', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-02',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      const contaReceber = {
        id: 'receber-1',
        valorTotal: 2000,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-01'),
        descricao: 'Venda',
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      const contaPagar = {
        id: 'pagar-1',
        valor_total: 5000,
        saldo: 0,
        status: 'Liquidada',
        data_liquidacao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-01'),
        descricao: 'Fornecedor',
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([contaReceber]);
      contasPagarRepository.find.mockResolvedValue([contaPagar]);

      const result = await service.gerarRelatorio(filtros);

      const linha = result.linhas.find((l) => l.data === '2025-01-01');

      expect(linha.saldoDiarioRealizado).toBe(-3000); // 2000 - 5000
      expect(linha.saldoDiarioRealizado).toBeLessThan(0);
    });
  });

  describe('Validações de cálculo - Saldo Acumulado', () => {
    it('deve acumular saldo corretamente ao longo dos dias', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-03',
        contaBancariaId: mockContaBancaria.id,
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(mockContaBancaria);

      // Dia 1: +3000
      const contaReceber1 = {
        id: 'receber-1',
        valorTotal: 3000,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-01'),
        descricao: 'Venda 1',
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      // Dia 2: +5000 - 2000 = +3000
      const contaReceber2 = {
        id: 'receber-2',
        valorTotal: 5000,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-02'),
        vencimento: new Date('2025-01-02'),
        descricao: 'Venda 2',
        documento: 'NF',
        serie: '002',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      const contaPagar1 = {
        id: 'pagar-1',
        valor_total: 2000,
        saldo: 0,
        status: 'Liquidada',
        data_liquidacao: new Date('2025-01-02'),
        vencimento: new Date('2025-01-02'),
        descricao: 'Fornecedor 1',
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      // Dia 3: -4000
      const contaPagar2 = {
        id: 'pagar-2',
        valor_total: 4000,
        saldo: 0,
        status: 'Liquidada',
        data_liquidacao: new Date('2025-01-03'),
        vencimento: new Date('2025-01-03'),
        descricao: 'Fornecedor 2',
        documento: 'NF',
        serie: '002',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([
        contaReceber1,
        contaReceber2,
      ]);
      contasPagarRepository.find.mockResolvedValue([contaPagar1, contaPagar2]);

      const result = await service.gerarRelatorio(filtros);

      const linha1 = result.linhas.find((l) => l.data === '2025-01-01');
      const linha2 = result.linhas.find((l) => l.data === '2025-01-02');
      const linha3 = result.linhas.find((l) => l.data === '2025-01-03');

      // Saldo Inicial: 10000
      // Dia 1: +3000 → Acumulado = 13000
      expect(linha1.saldoAcumuladoRealizado).toBe(13000);

      // Dia 2: +3000 (5000 - 2000) → Acumulado = 16000
      expect(linha2.saldoAcumuladoRealizado).toBe(16000);

      // Dia 3: -4000 → Acumulado = 12000
      expect(linha3.saldoAcumuladoRealizado).toBe(12000);

      // Saldo Final deve ser igual ao último saldo acumulado
      expect(result.totais.saldoFinalRealizado).toBe(12000);
    });

    it('deve inicializar saldo acumulado com saldo inicial da conta bancária', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
        contaBancariaId: mockContaBancaria.id,
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(mockContaBancaria);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      const linha = result.linhas.find((l) => l.data === '2025-01-01');

      // Sem movimentações, saldo acumulado = saldo inicial
      expect(linha.saldoAcumuladoRealizado).toBe(mockContaBancaria.saldo_inicial);
    });

    it('deve calcular saldo acumulado previsto separadamente do realizado', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-02',
        contaBancariaId: mockContaBancaria.id,
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(mockContaBancaria);

      // Dia 1: Realizado +2000, Previsto +5000
      const contaReceberRealizada = {
        id: 'receber-1',
        valorTotal: 2000,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-01'),
        descricao: 'Venda Realizada',
        documento: 'NF',
        serie: '001',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      const contaReceberPendente = {
        id: 'receber-2',
        valorTotal: 5000,
        saldo: 5000,
        status: 'PENDENTE',
        dataLiquidacao: null,
        vencimento: new Date('2025-01-02'),
        descricao: 'Venda Prevista',
        documento: 'NF',
        serie: '002',
        parcela: '1/1',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([
        contaReceberRealizada,
        contaReceberPendente,
      ]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      const linha1 = result.linhas.find((l) => l.data === '2025-01-01');
      const linha2 = result.linhas.find((l) => l.data === '2025-01-02');

      // Dia 1: Saldo Inicial (10000) + Realizado (2000) = 12000
      expect(linha1.saldoAcumuladoRealizado).toBe(12000);

      // Dia 2: Saldo Anterior (12000) + 0 = 12000
      expect(linha2.saldoAcumuladoRealizado).toBe(12000);

      // Dia 1: Saldo Inicial (10000) + 0 previsto = 10000
      expect(linha1.saldoAcumuladoPrevisto).toBe(10000);

      // Dia 2: Saldo Anterior (10000) + Previsto (5000) = 15000
      expect(linha2.saldoAcumuladoPrevisto).toBe(15000);
    });
  });

  describe('Validações de período e filtros', () => {
    it('deve gerar linhas para todos os dias do período', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-05', // 5 dias
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      // Deve ter 5 linhas (uma para cada dia)
      expect(result.linhas).toHaveLength(5);

      // Verificar que todas as datas estão presentes
      expect(result.linhas.map((l) => l.data)).toEqual([
        '2025-01-01',
        '2025-01-02',
        '2025-01-03',
        '2025-01-04',
        '2025-01-05',
      ]);
    });

    it('deve considerar apenas contas não deletadas', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      await service.gerarRelatorio(filtros);

      // Verificar que os filtros foram aplicados corretamente
      expect(contasReceberRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          deletadoEm: null,
        }),
        expect.any(Object),
      );

      expect(contasPagarRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          deletado_em: null,
        }),
        expect.any(Object),
      );
    });

    it('deve filtrar por empresa quando especificado', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
        consolidado: false,
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      await service.gerarRelatorio(filtros);

      expect(contasReceberRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: mockEmpresa.id,
        }),
        expect.any(Object),
      );

      expect(contasPagarRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          empresa_id: mockEmpresa.id,
        }),
        expect.any(Object),
      );
    });
  });

  describe('Validações de totalizadores', () => {
    it('deve calcular totais corretamente', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-03',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      const contasReceber = [
        {
          id: 'receber-1',
          valorTotal: 10000,
          saldo: 0,
          status: 'LIQUIDADA',
          dataLiquidacao: new Date('2025-01-01'),
          vencimento: new Date('2025-01-01'),
          descricao: 'Venda 1',
          documento: 'NF',
          serie: '001',
          parcela: '1/1',
          pessoa: mockPessoa,
        },
        {
          id: 'receber-2',
          valorTotal: 5000,
          saldo: 5000,
          status: 'PENDENTE',
          dataLiquidacao: null,
          vencimento: new Date('2025-01-02'),
          descricao: 'Venda 2',
          documento: 'NF',
          serie: '002',
          parcela: '1/1',
          pessoa: mockPessoa,
        },
      ];

      const contasPagar = [
        {
          id: 'pagar-1',
          valor_total: 3000,
          saldo: 0,
          status: 'Liquidada',
          data_liquidacao: new Date('2025-01-01'),
          vencimento: new Date('2025-01-01'),
          descricao: 'Fornecedor 1',
          documento: 'NF',
          serie: '001',
          parcela: '1/1',
          pessoa: mockPessoa,
        },
        {
          id: 'pagar-2',
          valor_total: 2000,
          saldo: 2000,
          status: 'Pendente',
          data_liquidacao: null,
          vencimento: new Date('2025-01-03'),
          descricao: 'Fornecedor 2',
          documento: 'NF',
          serie: '002',
          parcela: '1/1',
          pessoa: mockPessoa,
        },
      ];

      contasReceberRepository.find.mockResolvedValue(contasReceber);
      contasPagarRepository.find.mockResolvedValue(contasPagar);

      const result = await service.gerarRelatorio(filtros);

      // Total Entradas Realizadas = 10000
      expect(result.totais.totalEntradasRealizadas).toBe(10000);

      // Total Entradas Previstas = 5000
      expect(result.totais.totalEntradasPrevistas).toBe(5000);

      // Total Saídas Realizadas = 3000
      expect(result.totais.totalSaidasRealizadas).toBe(3000);

      // Total Saídas Previstas = 2000
      expect(result.totais.totalSaidasPrevistas).toBe(2000);
    });

    it('deve incluir informações da conta bancária quando especificada', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
        contaBancariaId: mockContaBancaria.id,
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(mockContaBancaria);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      expect(result.contaBancaria).toBeDefined();
      expect(result.contaBancaria.id).toBe(mockContaBancaria.id);
      expect(result.contaBancaria.banco).toBe(mockContaBancaria.banco);
      expect(result.contaBancaria.saldo_inicial).toBe(
        mockContaBancaria.saldo_inicial,
      );
    });

    it('deve incluir informações da empresa quando especificada', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);
      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      expect(result.empresa).toBeDefined();
      expect(result.empresa.id).toBe(mockEmpresa.id);
      expect(result.empresa.razao_social).toBe(mockEmpresa.razao_social);
    });
  });

  describe('Validações de detalhes por data', () => {
    it('deve incluir detalhes de entradas realizadas', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      const contaReceber = {
        id: 'receber-1',
        descricao: 'Venda Produto X',
        valorTotal: 7500,
        saldo: 0,
        status: 'LIQUIDADA',
        dataLiquidacao: new Date('2025-01-01'),
        vencimento: new Date('2025-01-01'),
        documento: 'NF',
        serie: '123',
        parcela: '2/3',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([contaReceber]);
      contasPagarRepository.find.mockResolvedValue([]);

      const result = await service.gerarRelatorio(filtros);

      const linha = result.linhas.find((l) => l.data === '2025-01-01');
      const detalhe = linha.detalhes.entradasRealizadas[0];

      expect(detalhe).toBeDefined();
      expect(detalhe.id).toBe('receber-1');
      expect(detalhe.descricao).toBe('Venda Produto X');
      expect(detalhe.valor).toBe(7500);
      expect(detalhe.documento).toBe('NF/123-2/3');
      expect(detalhe.pessoa).toBe(mockPessoa.fantasiaApelido);
    });

    it('deve incluir detalhes de saídas previstas com vencimento', async () => {
      const filtros: FluxoCaixaFiltrosDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-01',
      };

      empresaRepository.findOne.mockResolvedValue(mockEmpresa);
      contaBancariaRepository.findOne.mockResolvedValue(null);

      const contaPagar = {
        id: 'pagar-1',
        descricao: 'Fornecedor ABC',
        valor_total: 4500,
        saldo: 4500,
        status: 'Pendente',
        data_liquidacao: null,
        vencimento: new Date('2025-01-01'),
        documento: 'DUPLIC',
        serie: '456',
        parcela: '1/2',
        pessoa: mockPessoa,
      };

      contasReceberRepository.find.mockResolvedValue([]);
      contasPagarRepository.find.mockResolvedValue([contaPagar]);

      const result = await service.gerarRelatorio(filtros);

      const linha = result.linhas.find((l) => l.data === '2025-01-01');
      const detalhe = linha.detalhes.saidasPrevistas[0];

      expect(detalhe).toBeDefined();
      expect(detalhe.id).toBe('pagar-1');
      expect(detalhe.descricao).toBe('Fornecedor ABC');
      expect(detalhe.valor).toBe(4500);
      expect(detalhe.documento).toBe('DUPLIC/456-1/2');
      expect(detalhe.vencimento).toBe('2025-01-01');
    });
  });
});
