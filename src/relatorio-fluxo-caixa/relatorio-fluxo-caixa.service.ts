import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  FluxoCaixaFiltrosDto,
  FluxoCaixaResponse,
  FluxoCaixaLinha,
  FluxoCaixaDetalheItem,
  FluxoCaixaLinhaDetalhes,
} from './dto/fluxo-caixa.dto';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { Empresa } from '../entities/empresa/empresa.entity';

@Injectable()
export class RelatorioFluxoCaixaService {
  constructor(
    @InjectRepository(ContasPagar)
    private readonly contasPagarRepository: EntityRepository<ContasPagar>,
    @InjectRepository(ContasReceber)
    private readonly contasReceberRepository: EntityRepository<ContasReceber>,
    @InjectRepository(ContasBancarias)
    private readonly contaBancariaRepository: EntityRepository<ContasBancarias>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: EntityRepository<Empresa>,
    private readonly em: EntityManager,
  ) {}

  async gerarRelatorio(
    filtros: FluxoCaixaFiltrosDto,
  ): Promise<FluxoCaixaResponse> {
    const dataInicio = new Date(filtros.dataInicio);
    const dataFim = new Date(filtros.dataFim);

    // Buscar conta bancária se especificada
    let contaBancaria: ContasBancarias | null = null;
    if (filtros.contaBancariaId) {
      contaBancaria = await this.contaBancariaRepository.findOne({
        id: filtros.contaBancariaId,
      });
    }

    // Buscar empresa se especificada
    let empresa: Empresa | null = null;
    if (filtros.empresaId) {
      empresa = await this.empresaRepository.findOne({
        id: filtros.empresaId,
      });
    }

    // Buscar contas a pagar
    const contasPagarWhere: any = {
      deletado_em: null,
    };

    if (filtros.empresaId && !filtros.consolidado) {
      contasPagarWhere.empresa_id = filtros.empresaId;
    }

    const contasPagar = await this.contasPagarRepository.find(contasPagarWhere, {
      populate: ['pessoa', 'empresa'],
    });

    // Buscar contas a receber
    const contasReceberWhere: any = {
      deletadoEm: null,
    };

    if (filtros.empresaId && !filtros.consolidado) {
      contasReceberWhere.empresa = filtros.empresaId;
    }

    const contasReceber = await this.contasReceberRepository.find(
      contasReceberWhere,
      {
        populate: ['pessoa', 'empresa'],
      },
    );

    // Criar mapa de linhas por data
    const linhasMap = new Map<string, FluxoCaixaLinha>();

    // Preencher todas as datas do período
    const currentDate = new Date(dataInicio);
    while (currentDate <= dataFim) {
      const dateStr = currentDate.toISOString().split('T')[0];
      linhasMap.set(dateStr, {
        data: dateStr,
        entradasRealizadas: 0,
        entradasPrevistas: 0,
        saidasRealizadas: 0,
        saidasPrevistas: 0,
        saldoDiarioRealizado: 0,
        saldoDiarioPrevisto: 0,
        saldoAcumuladoRealizado: 0,
        saldoAcumuladoPrevisto: 0,
        detalhes: {
          entradasRealizadas: [],
          entradasPrevistas: [],
          saidasRealizadas: [],
          saidasPrevistas: [],
        },
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Processar contas a receber (ENTRADAS)
    for (const conta of contasReceber) {
      // Entrada realizada (liquidada)
      if (
        conta.dataLiquidacao &&
        new Date(conta.dataLiquidacao) >= dataInicio &&
        new Date(conta.dataLiquidacao) <= dataFim
      ) {
        const dateStr = new Date(conta.dataLiquidacao)
          .toISOString()
          .split('T')[0];
        const linha = linhasMap.get(dateStr);
        if (linha) {
          linha.entradasRealizadas += conta.valorTotal;
          linha.detalhes?.entradasRealizadas.push({
            id: conta.id,
            descricao: conta.descricao,
            valor: conta.valorTotal,
            documento: `${conta.documento}/${conta.serie}-${conta.parcela}`,
            pessoa: conta.pessoa?.fantasiaApelido || 'N/A',
          });
        }
      }

      // Entrada prevista (pendente ou parcial)
      if (
        (conta.status === 'PENDENTE' || conta.status === 'PARCIAL') &&
        new Date(conta.vencimento) >= dataInicio &&
        new Date(conta.vencimento) <= dataFim
      ) {
        const dateStr = new Date(conta.vencimento).toISOString().split('T')[0];
        const linha = linhasMap.get(dateStr);
        if (linha) {
          linha.entradasPrevistas += conta.saldo;
          linha.detalhes?.entradasPrevistas.push({
            id: conta.id,
            descricao: conta.descricao,
            valor: conta.saldo,
            documento: `${conta.documento}/${conta.serie}-${conta.parcela}`,
            pessoa: conta.pessoa?.fantasiaApelido || 'N/A',
            vencimento: conta.vencimento.toISOString().split('T')[0],
          });
        }
      }
    }

    // Processar contas a pagar (SAÍDAS)
    for (const conta of contasPagar) {
      // Saída realizada (liquidada)
      if (
        conta.data_liquidacao &&
        new Date(conta.data_liquidacao) >= dataInicio &&
        new Date(conta.data_liquidacao) <= dataFim
      ) {
        const dateStr = new Date(conta.data_liquidacao)
          .toISOString()
          .split('T')[0];
        const linha = linhasMap.get(dateStr);
        if (linha) {
          linha.saidasRealizadas += conta.valor_total;
          linha.detalhes?.saidasRealizadas.push({
            id: conta.id,
            descricao: conta.descricao,
            valor: conta.valor_total,
            documento: `${conta.documento}/${conta.serie}-${conta.parcela}`,
            pessoa: conta.pessoa?.fantasiaApelido || 'N/A',
          });
        }
      }

      // Saída prevista (pendente ou parcial)
      if (
        (conta.status === 'Pendente' || conta.status === 'Parcial') &&
        new Date(conta.vencimento) >= dataInicio &&
        new Date(conta.vencimento) <= dataFim
      ) {
        const dateStr = new Date(conta.vencimento).toISOString().split('T')[0];
        const linha = linhasMap.get(dateStr);
        if (linha) {
          linha.saidasPrevistas += conta.saldo;
          linha.detalhes?.saidasPrevistas.push({
            id: conta.id,
            descricao: conta.descricao,
            valor: conta.saldo,
            documento: `${conta.documento}/${conta.serie}-${conta.parcela}`,
            pessoa: conta.pessoa?.fantasiaApelido || 'N/A',
            vencimento: conta.vencimento.toISOString().split('T')[0],
          });
        }
      }
    }

    // Calcular saldos diários e acumulados
    let saldoAcumuladoRealizado = contaBancaria?.saldo_inicial || 0;
    let saldoAcumuladoPrevisto = contaBancaria?.saldo_inicial || 0;

    const linhas = Array.from(linhasMap.values()).sort((a, b) =>
      a.data.localeCompare(b.data),
    );

    for (const linha of linhas) {
      // Saldo diário = entradas - saídas
      linha.saldoDiarioRealizado =
        linha.entradasRealizadas - linha.saidasRealizadas;
      linha.saldoDiarioPrevisto = linha.entradasPrevistas - linha.saidasPrevistas;

      // Saldo acumulado
      saldoAcumuladoRealizado += linha.saldoDiarioRealizado;
      saldoAcumuladoPrevisto += linha.saldoDiarioPrevisto;

      linha.saldoAcumuladoRealizado = saldoAcumuladoRealizado;
      linha.saldoAcumuladoPrevisto = saldoAcumuladoPrevisto;
    }

    // Calcular totais
    const totais = {
      totalEntradasRealizadas: linhas.reduce(
        (acc, l) => acc + l.entradasRealizadas,
        0,
      ),
      totalEntradasPrevistas: linhas.reduce(
        (acc, l) => acc + l.entradasPrevistas,
        0,
      ),
      totalSaidasRealizadas: linhas.reduce(
        (acc, l) => acc + l.saidasRealizadas,
        0,
      ),
      totalSaidasPrevistas: linhas.reduce((acc, l) => acc + l.saidasPrevistas, 0),
      saldoFinalRealizado: saldoAcumuladoRealizado,
      saldoFinalPrevisto: saldoAcumuladoPrevisto,
    };

    // Montar resposta
    const response: FluxoCaixaResponse = {
      linhas,
      totais,
    };

    if (contaBancaria) {
      response.contaBancaria = {
        id: contaBancaria.id,
        banco: contaBancaria.banco,
        agencia: contaBancaria.agencia,
        conta: contaBancaria.conta,
        descricao: contaBancaria.descricao,
        saldo_inicial: contaBancaria.saldo_inicial,
      };
    }

    if (empresa) {
      response.empresa = {
        id: empresa.id,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
      };
    }

    return response;
  }
}
