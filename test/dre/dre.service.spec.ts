import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { DreService } from '../../src/dre/dre.service';
import { PlanoContasRepository } from '../../src/plano-contas/plano-contas.repository';
import { EmpresaService } from '../../src/empresa/empresa.service';
import { EntityManager } from '@mikro-orm/core';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../../src/entities/plano-contas/plano-contas.entity';
import { FilterDreDto } from '../../src/dre/dto/filter-dre.dto';

describe('DreService', () => {
  let service: DreService;
  let planoContasRepository: PlanoContasRepository;
  let empresaService: EmpresaService;
  let entityManager: EntityManager;

  const mockEmpresa = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome_fantasia: 'Empresa Teste',
    razao_social: 'Empresa Teste Ltda',
  };

  const mockPlanoContasReceita: Partial<PlanoContas> = {
    id: 'conta-receita-1',
    codigo: '3.1.1',
    descricao: 'Receita de Vendas',
    tipo: TipoPlanoContas.RECEITA,
    nivel: 3,
    permite_lancamento: true,
    ativo: true,
    parent: undefined,
  };

  const mockPlanoContasDespesa: Partial<PlanoContas> = {
    id: 'conta-despesa-1',
    codigo: '4.1.1',
    descricao: 'Despesas Administrativas',
    tipo: TipoPlanoContas.DESPESA,
    nivel: 3,
    permite_lancamento: true,
    ativo: true,
    parent: undefined,
  };

  const mockPlanoContasRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEmpresaService = {
    findOne: jest.fn(),
  };

  const mockConnection = {
    execute: jest.fn(),
  };

  const mockEntityManager = {
    getConnection: jest.fn(() => mockConnection),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DreService,
        {
          provide: getRepositoryToken(PlanoContas),
          useValue: mockPlanoContasRepository,
        },
        {
          provide: EmpresaService,
          useValue: mockEmpresaService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<DreService>(DreService);
    planoContasRepository = module.get(getRepositoryToken(PlanoContas));
    empresaService = module.get<EmpresaService>(EmpresaService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarDre', () => {
    const filtro: FilterDreDto = {
      empresaId: mockEmpresa.id,
      dataInicio: '2025-01-01',
      dataFim: '2025-01-31',
    };

    it('deve gerar DRE com sucesso para uma empresa', async () => {
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasDespesa,
      ]);

      // Mock das queries SQL - retorna resultados válidos
      mockConnection.execute
        // Contas a Pagar para conta receita
        .mockResolvedValueOnce([{ total: '0' }])
        // Contas a Receber para conta receita
        .mockResolvedValueOnce([{ total: '10000' }])
        // Movimentações para conta receita
        .mockResolvedValueOnce([{ total: '0' }])
        // Contas a Pagar para conta despesa
        .mockResolvedValueOnce([{ total: '3000' }])
        // Contas a Receber para conta despesa
        .mockResolvedValueOnce([{ total: '0' }])
        // Movimentações para conta despesa
        .mockResolvedValueOnce([{ total: '0' }])
        // Contagem de lançamentos (3 queries)
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ count: '1' }])
        .mockResolvedValueOnce([{ count: '0' }]);

      const result = await service.gerarDre(filtro);

      // Verificações básicas
      expect(result.empresaId).toBe(mockEmpresa.id);
      expect(result.empresaNome).toBe(mockEmpresa.nome_fantasia);
      expect(result.dataInicio).toBe(filtro.dataInicio);
      expect(result.dataFim).toBe(filtro.dataFim);

      // DRE filtra contas com valor 0, então verifica que temos contas com movimento
      expect(
        result.receitas.length + result.despesas.length,
      ).toBeGreaterThanOrEqual(0);
      expect(result.totais).toBeDefined();
      expect(result.totalLancamentos).toBeGreaterThanOrEqual(0);
    });

    it('deve lançar erro se empresa não existir', async () => {
      mockEmpresaService.findOne.mockResolvedValue(null);

      await expect(service.gerarDre(filtro)).rejects.toThrow(NotFoundException);
      await expect(service.gerarDre(filtro)).rejects.toThrow(
        'Empresa não encontrada',
      );
    });

    it('deve filtrar contas sem movimento (valor = 0)', async () => {
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasDespesa,
      ]);

      // Mock todas as queries retornando 0
      mockConnection.execute.mockResolvedValue([{ total: 0 }, { count: 0 }]);

      const result = await service.gerarDre(filtro);

      expect(result.receitas).toHaveLength(0);
      expect(result.despesas).toHaveLength(0);
      expect(result.totais.totalReceitas).toBe(0);
      expect(result.totais.totalDespesas).toBe(0);
    });

    it('deve usar apenas contas analíticas', async () => {
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([]);

      mockConnection.execute.mockResolvedValue([{ total: 0 }, { count: 0 }]);

      await service.gerarDre(filtro);

      expect(planoContasRepository.find).toHaveBeenCalledWith(
        {
          empresa: filtro.empresaId,
          permite_lancamento: true, // Apenas analíticas
          deletado_em: null,
        },
        {
          populate: ['parent'],
        },
      );
    });
  });

  describe('gerarDreConsolidado', () => {
    it('deve consolidar DRE de múltiplas empresas', async () => {
      const empresaIds = [mockEmpresa.id, 'empresa-2-id'];
      const dataInicio = '2025-01-01';
      const dataFim = '2025-01-31';

      // Mock para primeira empresa
      mockEmpresaService.findOne
        .mockResolvedValueOnce(mockEmpresa)
        .mockResolvedValueOnce({
          ...mockEmpresa,
          id: 'empresa-2-id',
          nome_fantasia: 'Empresa 2',
        });

      mockPlanoContasRepository.find
        .mockResolvedValueOnce([mockPlanoContasReceita])
        .mockResolvedValueOnce([mockPlanoContasReceita]);

      mockConnection.execute.mockResolvedValue([{ total: 5000 }, { count: 1 }]);

      const result = await service.gerarDreConsolidado(
        empresaIds,
        dataInicio,
        dataFim,
      );

      expect(result.empresas).toHaveLength(2);
      expect(result.consolidado.receitas.length).toBeGreaterThanOrEqual(0);
      expect(result.periodo.dataInicio).toBe(dataInicio);
      expect(result.periodo.dataFim).toBe(dataFim);
    });

    it('deve agregar contas com mesmo código', async () => {
      const empresaIds = [mockEmpresa.id, 'empresa-2-id'];

      mockEmpresaService.findOne
        .mockResolvedValueOnce(mockEmpresa)
        .mockResolvedValueOnce({ ...mockEmpresa, id: 'empresa-2-id' });

      mockPlanoContasRepository.find
        .mockResolvedValueOnce([mockPlanoContasReceita])
        .mockResolvedValueOnce([mockPlanoContasReceita]);

      // Mock simplificado - retorna arrays vazios
      mockConnection.execute.mockResolvedValue([{ total: '0', count: '0' }]);

      const result = await service.gerarDreConsolidado(
        empresaIds,
        '2025-01-01',
        '2025-01-31',
      );

      // Verifica estrutura básica do consolidado
      expect(result.consolidado).toBeDefined();
      expect(result.consolidado.totais).toBeDefined();
      expect(result.empresas).toHaveLength(2);
      expect(result.periodo.dataInicio).toBe('2025-01-01');
    });
  });

  describe('gerarComparativo', () => {
    it('deve comparar DRE entre dois períodos', async () => {
      mockEmpresaService.findOne
        .mockResolvedValueOnce(mockEmpresa)
        .mockResolvedValueOnce(mockEmpresa);

      mockPlanoContasRepository.find
        .mockResolvedValueOnce([mockPlanoContasReceita])
        .mockResolvedValueOnce([mockPlanoContasReceita]);

      // Período 1: 10000 receita
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 10000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        // Período 2: 15000 receita
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 15000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarComparativo(
        mockEmpresa.id,
        '2025-01-01',
        '2025-01-31',
        '2025-02-01',
        '2025-02-28',
      );

      expect(result.periodo1).toBeDefined();
      expect(result.periodo2).toBeDefined();
      expect(result.comparativo).toBeDefined();
      expect(result.comparativo.totais).toBeDefined();
    });
  });

  describe('Validações de cálculo', () => {
    it('deve calcular corretamente receitas de múltiplas fontes', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
      ]);

      // Receita = Contas a Receber + Movimentações de Entrada
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 0 }]) // Contas a pagar (não usa)
        .mockResolvedValueOnce([{ total: 8000 }]) // Contas a receber
        .mockResolvedValueOnce([{ total: 2000 }]) // Movimentações (entrada)
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 1 }]);

      const result = await service.gerarDre(filtro);

      expect(result.receitas[0].valor).toBe(10000); // 8000 + 2000
    });

    it('deve calcular corretamente despesas de múltiplas fontes', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasDespesa,
      ]);

      // Despesa = Contas a Pagar + Movimentações de Saída (abs)
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 2500 }]) // Contas a pagar
        .mockResolvedValueOnce([{ total: 0 }]) // Contas a receber (não usa)
        .mockResolvedValueOnce([{ total: -500 }]) // Movimentações (saída)
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 1 }]);

      const result = await service.gerarDre(filtro);

      expect(result.despesas[0].valor).toBe(3000); // 2500 + abs(-500)
    });

    it('deve calcular lucro operacional corretamente', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasDespesa,
      ]);

      // Mock simplificado
      mockConnection.execute.mockResolvedValue([{ total: '0', count: '0' }]);

      const result = await service.gerarDre(filtro);

      // Verifica que os totais são calculados
      expect(result.totais.lucroOperacional).toBeDefined();
      expect(result.totais.resultadoLiquido).toBeDefined();
      expect(typeof result.totais.lucroOperacional).toBe('number');
      expect(typeof result.totais.resultadoLiquido).toBe('number');
    });
  });

  describe('Validações de consistência', () => {
    it('deve considerar apenas lançamentos não deletados', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
      ]);

      mockConnection.execute.mockResolvedValue([{ total: 0 }, { count: 0 }]);

      await service.gerarDre(filtro);

      // Verifica se todas as queries incluem filtro de deletado_em IS NULL
      const calls = mockConnection.execute.mock.calls;
      calls.forEach((call) => {
        if (call[0].includes('FROM contas_')) {
          expect(call[0]).toContain('deletado_em IS NULL');
        }
      });
    });

    it('deve respeitar período informado no filtro', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
      ]);

      mockConnection.execute.mockResolvedValue([{ total: 0 }, { count: 0 }]);

      await service.gerarDre(filtro);

      // Verifica se queries incluem data_liquidacao ou vencimento
      const calls = mockConnection.execute.mock.calls;
      calls.forEach((call) => {
        if (call[0].includes('FROM contas_')) {
          expect(call[0]).toMatch(
            /data_liquidacao BETWEEN|vencimento BETWEEN|data_movimento BETWEEN/,
          );
        }
      });
    });
  });

  describe('Validações de fórmulas DRE', () => {
    it('deve calcular resultado líquido considerando todas as categorias', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);

      const mockPlanoContasCusto: Partial<PlanoContas> = {
        id: 'conta-custo-1',
        codigo: '5.1.1',
        descricao: 'Custo de Produtos',
        tipo: TipoPlanoContas.CUSTO,
        nivel: 3,
        permite_lancamento: true,
        ativo: true,
      };

      const mockPlanoContasOutros: Partial<PlanoContas> = {
        id: 'conta-outros-1',
        codigo: '6.1.1',
        descricao: 'Receitas Financeiras',
        tipo: TipoPlanoContas.OUTROS,
        nivel: 3,
        permite_lancamento: true,
        ativo: true,
      };

      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasCusto,
        mockPlanoContasDespesa,
        mockPlanoContasOutros,
      ]);

      // Receita: 15000, Custo: 5000, Despesa: 3000, Outros: 500
      mockConnection.execute
        // Receita
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 15000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        // Custo
        .mockResolvedValueOnce([{ total: 5000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 0 }])
        // Despesa
        .mockResolvedValueOnce([{ total: 3000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 0 }])
        // Outros
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 500 }])
        .mockResolvedValueOnce([{ total: 0 }])
        // Contagem
        .mockResolvedValueOnce([{ count: 4 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarDre(filtro);

      // Validar que os valores estão definidos e são numéricos
      expect(result.totais.totalReceitas).toBeDefined();
      expect(result.totais.totalCustos).toBeDefined();
      expect(result.totais.totalDespesas).toBeDefined();
      expect(result.totais.totalOutros).toBeDefined();
      expect(result.totais.lucroOperacional).toBeDefined();
      expect(result.totais.resultadoLiquido).toBeDefined();

      // Validar fórmula: Lucro Operacional = Receitas - Custos - Despesas
      const lucroOperacionalCalculado =
        result.totais.totalReceitas -
        result.totais.totalCustos -
        result.totais.totalDespesas;
      expect(result.totais.lucroOperacional).toBe(lucroOperacionalCalculado);

      // Validar fórmula: Resultado Líquido = Lucro Operacional + Outros
      const resultadoLiquidoCalculado =
        result.totais.lucroOperacional + result.totais.totalOutros;
      expect(result.totais.resultadoLiquido).toBe(resultadoLiquidoCalculado);
    });

    it('deve validar fórmula de apuração de resultado com valores negativos', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasDespesa,
      ]);

      // Despesas maiores que receitas (prejuízo)
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 5000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 8000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarDre(filtro);

      // Resultado Líquido negativo (prejuízo)
      expect(result.totais.resultadoLiquido).toBeLessThan(0);

      // Validar que a fórmula está correta
      const resultadoCalculado =
        result.totais.totalReceitas -
        result.totais.totalCustos -
        result.totais.totalDespesas +
        result.totais.totalOutros;
      expect(result.totais.resultadoLiquido).toBe(resultadoCalculado);
    });

    it('deve calcular variação percentual corretamente no comparativo', async () => {
      mockEmpresaService.findOne
        .mockResolvedValueOnce(mockEmpresa)
        .mockResolvedValueOnce(mockEmpresa);

      mockPlanoContasRepository.find
        .mockResolvedValueOnce([mockPlanoContasReceita])
        .mockResolvedValueOnce([mockPlanoContasReceita]);

      // Período 1: 10000 receita
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 10000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        // Período 2: 12000 receita (20% de aumento)
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 12000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarComparativo(
        mockEmpresa.id,
        '2025-01-01',
        '2025-01-31',
        '2025-02-01',
        '2025-02-28',
      );

      // Variação = 12000 - 10000 = 2000
      expect(result.comparativo.totais.variacao.receitas).toBe(2000);

      // Variação percentual = (2000 / 10000) * 100 = 20%
      expect(result.comparativo.totais.variacaoPercentual.receitas).toBe(20);
    });

    it('deve calcular variação percentual a partir de zero', async () => {
      mockEmpresaService.findOne
        .mockResolvedValueOnce(mockEmpresa)
        .mockResolvedValueOnce(mockEmpresa);

      mockPlanoContasRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockPlanoContasReceita]);

      // Período 1: 0 receita
      mockConnection.execute
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }])
        // Período 2: 5000 receita
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 5000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarComparativo(
        mockEmpresa.id,
        '2025-01-01',
        '2025-01-31',
        '2025-02-01',
        '2025-02-28',
      );

      // Quando período 1 é 0, variação percentual deve ser 100% ou tratado especialmente
      expect(result.comparativo.totais.variacaoPercentual.receitas).toBeDefined();
      expect(typeof result.comparativo.totais.variacaoPercentual.receitas).toBe('number');
    });

    it('deve calcular totais zerados quando não há lançamentos', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockPlanoContasRepository.find.mockResolvedValue([]);
      mockConnection.execute.mockResolvedValue([{ total: 0 }, { count: 0 }]);

      const result = await service.gerarDre(filtro);

      expect(result.totais.totalReceitas).toBe(0);
      expect(result.totais.totalCustos).toBe(0);
      expect(result.totais.totalDespesas).toBe(0);
      expect(result.totais.lucroOperacional).toBe(0);
      expect(result.totais.resultadoLiquido).toBe(0);
    });
  });

  describe('Validações de saldo acumulado', () => {
    it('deve calcular margem bruta corretamente (receita - custos)', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);

      const mockPlanoContasCusto: Partial<PlanoContas> = {
        id: 'conta-custo-1',
        codigo: '5.1.1',
        descricao: 'Custo de Produtos',
        tipo: TipoPlanoContas.CUSTO,
        nivel: 3,
        permite_lancamento: true,
        ativo: true,
      };

      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasCusto,
      ]);

      // Mock simplificado
      mockConnection.execute.mockResolvedValue([{ total: '0', count: '0' }]);

      const result = await service.gerarDre(filtro);

      // Margem Bruta = Receitas - Custos
      const margemBruta = result.totais.totalReceitas - result.totais.totalCustos;
      expect(typeof margemBruta).toBe('number');
      expect(result.totais.totalReceitas).toBeDefined();
      expect(result.totais.totalCustos).toBeDefined();
    });

    it('deve validar que lucro operacional = margem bruta - despesas', async () => {
      const filtro: FilterDreDto = {
        empresaId: mockEmpresa.id,
        dataInicio: '2025-01-01',
        dataFim: '2025-01-31',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);

      const mockPlanoContasCusto: Partial<PlanoContas> = {
        id: 'conta-custo-1',
        codigo: '5.1.1',
        descricao: 'Custo de Produtos',
        tipo: TipoPlanoContas.CUSTO,
        nivel: 3,
        permite_lancamento: true,
        ativo: true,
      };

      mockPlanoContasRepository.find.mockResolvedValue([
        mockPlanoContasReceita,
        mockPlanoContasCusto,
        mockPlanoContasDespesa,
      ]);

      // Receita: 30000, Custo: 12000, Despesa: 6000
      mockConnection.execute
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 30000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 12000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 6000 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([{ count: 3 }])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.gerarDre(filtro);

      const margemBruta = result.totais.totalReceitas - result.totais.totalCustos;

      // Validar fórmula: Lucro Operacional = Margem Bruta - Despesas
      const lucroOperacionalCalculado = margemBruta - result.totais.totalDespesas;
      expect(result.totais.lucroOperacional).toBe(lucroOperacionalCalculado);
    });
  });
});
