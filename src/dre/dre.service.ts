import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PlanoContasRepository } from '../plano-contas/plano-contas.repository';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../entities/plano-contas/plano-contas.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { FilterDreDto } from './dto/filter-dre.dto';
import {
  DreResponseDto,
  DreLinhaDto,
  DreTotaisDto,
  DreConsolidadoDto,
  DreComparativoDto,
  DreLinhaComparativoDto,
  DreTotaisComparativoDto,
} from './dto/dre-response.dto';
import {
  RelatorioDreFiltrosDto,
  RelatorioDreResponse,
  DreItemLinha,
  DreTotalizadores,
} from './dto/relatorio-dre.dto';
import { Empresa } from '../entities/empresa/empresa.entity';

@Injectable()
export class DreService {
  constructor(
    @InjectRepository(PlanoContas)
    private readonly planoContasRepository: PlanoContasRepository,
    private readonly empresaService: EmpresaService,
    private readonly em: EntityManager,
  ) {}

  /**
   * Gera DRE para uma empresa em um período específico
   */
  async gerarDre(filtro: FilterDreDto): Promise<DreResponseDto> {
    // Validar empresa
    const empresa = await this.empresaService.findOne(filtro.empresaId);
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Buscar todas as contas analíticas da empresa
    const contasAnaliticas = await this.planoContasRepository.find(
      {
        empresa: filtro.empresaId,
        permite_lancamento: true, // Apenas analíticas
        deletado_em: null,
      },
      {
        populate: ['parent'],
      },
    );

    // Calcular valores de cada conta no período
    const linhas = await Promise.all(
      contasAnaliticas.map((conta) =>
        this.calcularValorConta(conta, filtro.dataInicio, filtro.dataFim),
      ),
    );

    // Filtrar contas com movimento (valor != 0)
    const linhasComMovimento = linhas.filter((linha) => linha.valor !== 0);

    // Agrupar por tipo
    const receitas = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.RECEITA,
    );
    const custos = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.CUSTO,
    );
    const despesas = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.DESPESA,
    );
    const outros = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.OUTROS,
    );

    // Calcular totais
    const totais = this.calcularTotais(receitas, custos, despesas, outros);

    // Contar total de lançamentos no período
    const totalLancamentos = await this.contarLancamentosPeriodo(
      filtro.empresaId,
      filtro.dataInicio,
      filtro.dataFim,
    );

    return new DreResponseDto({
      empresaId: filtro.empresaId,
      empresaNome: empresa.nome_fantasia || empresa.razao_social,
      dataInicio: filtro.dataInicio,
      dataFim: filtro.dataFim,
      receitas,
      custos,
      despesas,
      outros,
      totais,
      geradoEm: new Date(),
      totalLancamentos,
    });
  }

  /**
   * Calcula o valor total de uma conta no período
   * Soma valores de: Contas a Pagar + Contas a Receber + Movimentações
   */
  private async calcularValorConta(
    conta: PlanoContas,
    dataInicio: string,
    dataFim: string,
  ): Promise<DreLinhaDto> {
    const connection = this.em.getConnection();

    // Contas a Pagar (despesas/custos - valores negativos)
    const resultPagar = await connection.execute(
      `SELECT COALESCE(SUM(valor_total), 0) as total
       FROM contas_pagar
       WHERE plano_contas_id = ?
         AND deletado_em IS NULL
         AND (data_liquidacao BETWEEN ? AND ?
              OR (data_liquidacao IS NULL AND vencimento BETWEEN ? AND ?))`,
      [conta.id, dataInicio, dataFim, dataInicio, dataFim],
    );

    // Contas a Receber (receitas - valores positivos)
    const resultReceber = await connection.execute(
      `SELECT COALESCE(SUM(valor_total), 0) as total
       FROM contas_receber
       WHERE plano_contas_id = ?
         AND deletado_em IS NULL
         AND (data_liquidacao BETWEEN ? AND ?
              OR (data_liquidacao IS NULL AND vencimento BETWEEN ? AND ?))`,
      [conta.id, dataInicio, dataFim, dataInicio, dataFim],
    );

    // Movimentações Bancárias
    // Entrada = positivo, Saída = negativo
    const resultMovimentacoes = await connection.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo_movimento = 'Entrada' THEN valor ELSE -valor END), 0) as total
       FROM movimentacoes_bancarias
       WHERE plano_contas_id = ?
         AND deletado_em IS NULL
         AND data_movimento BETWEEN ? AND ?`,
      [conta.id, dataInicio, dataFim],
    );

    const totalPagar = Number(resultPagar[0]?.total || 0);
    const totalReceber = Number(resultReceber[0]?.total || 0);
    const totalMovimentacoes = Number(resultMovimentacoes[0]?.total || 0);

    // Calcular valor final baseado no tipo da conta
    let valorFinal = 0;

    switch (conta.tipo) {
      case TipoPlanoContas.RECEITA:
        // Receitas: somar valores positivos (receber + movimentações entrada)
        valorFinal = totalReceber + totalMovimentacoes;
        break;

      case TipoPlanoContas.CUSTO:
      case TipoPlanoContas.DESPESA:
        // Custos/Despesas: somar valores negativos (pagar + movimentações saída)
        valorFinal = totalPagar + Math.abs(totalMovimentacoes);
        break;

      case TipoPlanoContas.OUTROS:
        // Outros: considerar todas as movimentações
        valorFinal = totalReceber + totalPagar + totalMovimentacoes;
        break;
    }

    return {
      contaId: conta.id,
      codigo: conta.codigo,
      descricao: conta.descricao,
      tipo: conta.tipo,
      nivel: conta.nivel,
      valor: valorFinal,
      parentCodigo: conta.parent?.codigo,
    };
  }

  /**
   * Calcula os totais do DRE
   */
  private calcularTotais(
    receitas: DreLinhaDto[],
    custos: DreLinhaDto[],
    despesas: DreLinhaDto[],
    outros: DreLinhaDto[],
  ): DreTotaisDto {
    const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
    const totalCustos = custos.reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);
    const totalOutros = outros.reduce((sum, l) => sum + l.valor, 0);

    const lucroOperacional = totalReceitas - totalCustos - totalDespesas;
    const resultadoLiquido = lucroOperacional + totalOutros;

    return {
      totalReceitas,
      totalCustos,
      totalDespesas,
      totalOutros,
      lucroOperacional,
      resultadoLiquido,
    };
  }

  /**
   * Conta total de lançamentos no período
   */
  private async contarLancamentosPeriodo(
    empresaId: string,
    dataInicio: string,
    dataFim: string,
  ): Promise<number> {
    const connection = this.em.getConnection();

    const resultPagar = await connection.execute(
      `SELECT COUNT(*) as count
       FROM contas_pagar
       WHERE empresa_id = ?
         AND deletado_em IS NULL
         AND (data_liquidacao BETWEEN ? AND ?
              OR (data_liquidacao IS NULL AND vencimento BETWEEN ? AND ?))`,
      [empresaId, dataInicio, dataFim, dataInicio, dataFim],
    );

    const resultReceber = await connection.execute(
      `SELECT COUNT(*) as count
       FROM contas_receber
       WHERE empresa_id = ?
         AND deletado_em IS NULL
         AND (data_liquidacao BETWEEN ? AND ?
              OR (data_liquidacao IS NULL AND vencimento BETWEEN ? AND ?))`,
      [empresaId, dataInicio, dataFim, dataInicio, dataFim],
    );

    const resultMovimentacoes = await connection.execute(
      `SELECT COUNT(*) as count
       FROM movimentacoes_bancarias
       WHERE empresa_id = ?
         AND deletado_em IS NULL
         AND data_movimento BETWEEN ? AND ?`,
      [empresaId, dataInicio, dataFim],
    );

    return (
      Number(resultPagar[0]?.count || 0) +
      Number(resultReceber[0]?.count || 0) +
      Number(resultMovimentacoes[0]?.count || 0)
    );
  }

  /**
   * Gera DRE consolidado para múltiplas empresas
   */
  async gerarDreConsolidado(
    empresaIds: string[],
    dataInicio: string,
    dataFim: string,
  ): Promise<DreConsolidadoDto> {
    // Gerar DRE individual para cada empresa
    const dres = await Promise.all(
      empresaIds.map((empresaId) =>
        this.gerarDre({ empresaId, dataInicio, dataFim }),
      ),
    );

    // Consolidar valores
    const consolidado = this.consolidarDres(dres);

    return {
      periodo: {
        dataInicio,
        dataFim,
      },
      empresas: dres.map((dre) => ({
        empresaId: dre.empresaId,
        empresaNome: dre.empresaNome,
        dre,
      })),
      consolidado,
      geradoEm: new Date(),
    };
  }

  /**
   * Consolida múltiplos DREs em um único
   */
  private consolidarDres(dres: DreResponseDto[]): {
    receitas: DreLinhaDto[];
    custos: DreLinhaDto[];
    despesas: DreLinhaDto[];
    outros: DreLinhaDto[];
    totais: DreTotaisDto;
  } {
    // Agregar linhas por código de conta
    const agregadoPorCodigo = new Map<string, DreLinhaDto>();

    dres.forEach((dre) => {
      [...dre.receitas, ...dre.custos, ...dre.despesas, ...dre.outros].forEach(
        (linha) => {
          const existente = agregadoPorCodigo.get(linha.codigo);
          if (existente) {
            existente.valor += linha.valor;
          } else {
            agregadoPorCodigo.set(linha.codigo, { ...linha });
          }
        },
      );
    });

    const linhasConsolidadas = Array.from(agregadoPorCodigo.values());

    // Separar por tipo
    const receitas = linhasConsolidadas.filter(
      (l) => l.tipo === TipoPlanoContas.RECEITA,
    );
    const custos = linhasConsolidadas.filter(
      (l) => l.tipo === TipoPlanoContas.CUSTO,
    );
    const despesas = linhasConsolidadas.filter(
      (l) => l.tipo === TipoPlanoContas.DESPESA,
    );
    const outros = linhasConsolidadas.filter(
      (l) => l.tipo === TipoPlanoContas.OUTROS,
    );

    // Calcular totais consolidados
    const totais = this.calcularTotais(receitas, custos, despesas, outros);

    return {
      receitas,
      custos,
      despesas,
      outros,
      totais,
    };
  }

  /**
   * Gera comparativo de DRE entre períodos
   */
  async gerarComparativo(
    empresaId: string,
    periodo1Inicio: string,
    periodo1Fim: string,
    periodo2Inicio: string,
    periodo2Fim: string,
  ): Promise<DreComparativoDto> {
    const dre1 = await this.gerarDre({
      empresaId,
      dataInicio: periodo1Inicio,
      dataFim: periodo1Fim,
    });

    const dre2 = await this.gerarDre({
      empresaId,
      dataInicio: periodo2Inicio,
      dataFim: periodo2Fim,
    });

    // Comparar linhas
    const receitas = this.compararLinhas(dre1.receitas, dre2.receitas);
    const custos = this.compararLinhas(dre1.custos, dre2.custos);
    const despesas = this.compararLinhas(dre1.despesas, dre2.despesas);
    const outros = this.compararLinhas(dre1.outros, dre2.outros);

    // Calcular totais comparativos
    const totais = this.compararTotais(dre1.totais, dre2.totais);

    return {
      empresaId: dre1.empresaId,
      empresaNome: dre1.empresaNome,
      periodo1: {
        dataInicio: periodo1Inicio,
        dataFim: periodo1Fim,
        dre: dre1,
      },
      periodo2: {
        dataInicio: periodo2Inicio,
        dataFim: periodo2Fim,
        dre: dre2,
      },
      comparativo: {
        receitas,
        custos,
        despesas,
        outros,
        totais,
      },
      geradoEm: new Date(),
    };
  }

  /**
   * Compara linhas de dois períodos e calcula variações
   */
  private compararLinhas(
    linhas1: DreLinhaDto[],
    linhas2: DreLinhaDto[],
  ): DreLinhaComparativoDto[] {
    // Criar mapa por código de conta
    const mapaLinhas2 = new Map<string, DreLinhaDto>();
    linhas2.forEach((linha) => mapaLinhas2.set(linha.codigo, linha));

    // Comparar linhas do período 1 com período 2
    const linhasComparativas: DreLinhaComparativoDto[] = [];

    // Adicionar linhas do período 1 com comparação
    linhas1.forEach((linha1) => {
      const linha2 = mapaLinhas2.get(linha1.codigo);
      const valor2 = linha2?.valor || 0;
      const variacao = valor2 - linha1.valor;
      const variacaoPercentual =
        linha1.valor !== 0 ? (variacao / linha1.valor) * 100 : 0;

      linhasComparativas.push({
        ...linha1,
        variacao,
        variacaoPercentual,
      });

      // Marcar como processada
      mapaLinhas2.delete(linha1.codigo);
    });

    // Adicionar linhas que só existem no período 2
    mapaLinhas2.forEach((linha2) => {
      linhasComparativas.push({
        ...linha2,
        variacao: linha2.valor,
        variacaoPercentual: 100, // 100% de aumento (veio do zero)
      });
    });

    return linhasComparativas;
  }

  /**
   * Compara totais de dois períodos
   */
  private compararTotais(
    totais1: DreTotaisDto,
    totais2: DreTotaisDto,
  ): DreTotaisComparativoDto {
    const variacao = {
      receitas: totais2.totalReceitas - totais1.totalReceitas,
      custos: totais2.totalCustos - totais1.totalCustos,
      despesas: totais2.totalDespesas - totais1.totalDespesas,
      outros: totais2.totalOutros - totais1.totalOutros,
      lucroOperacional: totais2.lucroOperacional - totais1.lucroOperacional,
      resultadoLiquido: totais2.resultadoLiquido - totais1.resultadoLiquido,
    };

    const calcularPercentual = (valor1: number, valor2: number): number => {
      if (valor1 === 0) return valor2 !== 0 ? 100 : 0;
      return ((valor2 - valor1) / valor1) * 100;
    };

    const variacaoPercentual = {
      receitas: calcularPercentual(
        totais1.totalReceitas,
        totais2.totalReceitas,
      ),
      custos: calcularPercentual(totais1.totalCustos, totais2.totalCustos),
      despesas: calcularPercentual(
        totais1.totalDespesas,
        totais2.totalDespesas,
      ),
      outros: calcularPercentual(totais1.totalOutros, totais2.totalOutros),
      lucroOperacional: calcularPercentual(
        totais1.lucroOperacional,
        totais2.lucroOperacional,
      ),
      resultadoLiquido: calcularPercentual(
        totais1.resultadoLiquido,
        totais2.resultadoLiquido,
      ),
    };

    return {
      ...totais2, // Usar totais do período 2 como base
      variacao,
      variacaoPercentual,
    };
  }

  /**
   * Gera relatório DRE no formato esperado pelo frontend
   * Estrutura hierárquica com itens e totalizadores
   */
  async gerarRelatorioDre(
    filtros: RelatorioDreFiltrosDto,
  ): Promise<RelatorioDreResponse> {
    // Buscar empresa
    const empresa = await this.empresaService.findOne(filtros.empresaId);
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Buscar todas as contas analíticas da empresa
    const contasAnaliticas = await this.planoContasRepository.find(
      {
        empresa: filtros.empresaId,
        permite_lancamento: true,
        deletado_em: null,
      },
      {
        populate: ['parent'],
      },
    );

    // Calcular valores de cada conta no período
    const linhasCalculadas = await Promise.all(
      contasAnaliticas.map((conta) =>
        this.calcularValorConta(
          conta,
          filtros.dataInicio,
          filtros.dataFim,
        ),
      ),
    );

    // Filtrar contas com movimento
    const linhasComMovimento = linhasCalculadas.filter((l) => l.valor !== 0);

    // Converter para formato do frontend
    const itens: DreItemLinha[] = linhasComMovimento.map((linha) => ({
      id: linha.contaId,
      codigo: linha.codigo,
      descricao: linha.descricao,
      tipo: this.mapTipoParaFrontend(linha.tipo),
      nivel: linha.nivel,
      parentId: linha.parentCodigo,
      valor: Math.abs(linha.valor),
      percentual: 0, // Será calculado depois
    }));

    // Agrupar por tipo para calcular totais
    const receitas = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.RECEITA,
    );
    const custos = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.CUSTO,
    );
    const despesas = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.DESPESA,
    );
    const outros = linhasComMovimento.filter(
      (l) => l.tipo === TipoPlanoContas.OUTROS,
    );

    // Calcular totalizadores
    const receitaBruta = receitas.reduce((sum, l) => sum + l.valor, 0);
    const totalCustos = custos.reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);
    const totalOutros = outros.reduce((sum, l) => sum + l.valor, 0);

    const deducoes = 0; // Implementar lógica de deduções se necessário
    const receitaLiquida = receitaBruta - deducoes;
    const margemBruta = receitaLiquida - totalCustos;
    const resultadoOperacional = margemBruta - totalDespesas;
    const resultadoAntesImpostos = resultadoOperacional + totalOutros;
    const impostos = 0; // Implementar lógica de impostos se necessário
    const resultadoLiquido = resultadoAntesImpostos - impostos;

    const totalizadores: DreTotalizadores = {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos: totalCustos,
      margemBruta,
      despesasOperacionais: totalDespesas,
      resultadoOperacional,
      outrasReceitasDespesas: totalOutros,
      resultadoAntesImpostos,
      impostos,
      resultadoLiquido,
    };

    // Calcular percentuais em relação à receita bruta
    if (receitaBruta > 0) {
      itens.forEach((item) => {
        item.percentual = (item.valor / receitaBruta) * 100;
      });
    }

    // Montar resposta
    const response: RelatorioDreResponse = {
      itens,
      totalizadores,
      periodo: {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      },
      empresa: {
        id: empresa.id,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
      },
    };

    // Se centroCustoId foi fornecido, incluir na resposta
    if (filtros.centroCustoId) {
      // Buscar centro de custo (implementar se necessário)
      response.centroCusto = {
        id: filtros.centroCustoId,
        descricao: 'Centro de Custo', // Buscar do banco se houver entidade
      };
    }

    return response;
  }

  /**
   * Mapeia tipo do backend para tipo do frontend
   */
  private mapTipoParaFrontend(
    tipo: TipoPlanoContas,
  ): 'RECEITA' | 'CUSTO' | 'DESPESA' | 'RESULTADO' {
    switch (tipo) {
      case TipoPlanoContas.RECEITA:
        return 'RECEITA';
      case TipoPlanoContas.CUSTO:
        return 'CUSTO';
      case TipoPlanoContas.DESPESA:
        return 'DESPESA';
      case TipoPlanoContas.OUTROS:
        return 'RESULTADO';
      default:
        return 'RESULTADO';
    }
  }
}
