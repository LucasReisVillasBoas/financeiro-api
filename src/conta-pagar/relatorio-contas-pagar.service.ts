import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ContasPagarRepository } from './conta-pagar.repository';
import { ContasPagar, StatusContaPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { FiltroRelatorioContasPagarDto } from './dto/filtro-relatorio-contas-pagar.dto';
import {
  RelatorioContasPagar,
  ItemRelatorioContasPagar,
  TotaisPorFornecedor,
  TotaisPorPeriodo,
} from './interfaces/relatorio-contas-pagar.interface';

@Injectable()
export class RelatorioContasPagarService {
  constructor(
    @InjectRepository(ContasPagar)
    private readonly contaPagarRepository: ContasPagarRepository,
    private readonly em: EntityManager,
  ) {}

  async gerarRelatorio(filtro: FiltroRelatorioContasPagarDto): Promise<RelatorioContasPagar> {
    // Busca contas a pagar com filtros aplicados
    const contas = await this.buscarContasComFiltros(filtro);

    // Transforma em itens do relatório
    const itens = this.transformarEmItensRelatorio(contas);

    // Calcula totais gerais
    const totais = this.calcularTotaisGerais(itens);

    // Calcula totais por fornecedor
    const totaisPorFornecedor = this.calcularTotaisPorFornecedor(itens);

    // Calcula totais por período
    const totaisPorPeriodo = this.calcularTotaisPorPeriodo(itens);

    return {
      filtros: {
        fornecedor: filtro.fornecedorId
          ? contas.find((c) => c.pessoa.id === filtro.fornecedorId)?.pessoa.razaoNome
          : undefined,
        dataInicial: filtro.dataInicial,
        dataFinal: filtro.dataFinal,
        status: filtro.status,
      },
      itens,
      totais,
      totaisPorFornecedor,
      totaisPorPeriodo,
      dataGeracao: new Date(),
    };
  }

  private async buscarContasComFiltros(
    filtro: FiltroRelatorioContasPagarDto,
  ): Promise<ContasPagar[]> {
    const where: any = { deletadoEm: null };

    // Filtro por fornecedor
    if (filtro.fornecedorId) {
      where.pessoa = filtro.fornecedorId;
    }

    // Filtro por período (data de vencimento)
    if (filtro.dataInicial || filtro.dataFinal) {
      where.vencimento = {};
      if (filtro.dataInicial) {
        where.vencimento.$gte = new Date(filtro.dataInicial);
      }
      if (filtro.dataFinal) {
        where.vencimento.$lte = new Date(filtro.dataFinal);
      }
    }

    // Filtro por status
    if (filtro.status) {
      where.status = filtro.status;
    } else {
      // Se não especificou status, considera apenas não canceladas
      where.canceladoEm = null;
    }

    // Filtro por empresa
    if (filtro.empresaId) {
      where.empresa = filtro.empresaId;
    }

    return await this.contaPagarRepository.find(where, {
      populate: ['pessoa', 'empresa', 'planoContas'],
      orderBy: { vencimento: 'ASC' },
    });
  }

  private transformarEmItensRelatorio(contas: ContasPagar[]): ItemRelatorioContasPagar[] {
    return contas.map((conta) => ({
      id: conta.id,
      documento: conta.documento,
      serie: conta.serie || '',
      parcela: conta.parcela,
      fornecedor: conta.pessoa.razaoNome || conta.pessoa.fantasiaApelido || 'Sem nome',
      fornecedorId: conta.pessoa.id,
      dataEmissao: conta.data_emissao,
      dataVencimento: conta.vencimento,
      dataLiquidacao: conta.data_liquidacao,
      valorPrincipal: conta.valor_principal,
      acrescimos: conta.acrescimos,
      descontos: conta.descontos,
      valorTotal: conta.valor_total,
      saldo: conta.saldo,
      status: conta.status as StatusContaPagar,
      empresa: conta.empresa.nome_fantasia || conta.empresa.razao_social,
    }));
  }

  private calcularTotaisGerais(itens: ItemRelatorioContasPagar[]) {
    return {
      quantidade: itens.length,
      valorTotal: itens.reduce((sum, item) => sum + Number(item.valorTotal), 0),
      valorPago: itens.reduce((sum, item) => sum + (Number(item.valorTotal) - Number(item.saldo)), 0),
      saldo: itens.reduce((sum, item) => sum + Number(item.saldo), 0),
    };
  }

  private calcularTotaisPorFornecedor(itens: ItemRelatorioContasPagar[]): TotaisPorFornecedor[] {
    const porFornecedor = new Map<string, TotaisPorFornecedor>();

    itens.forEach((item) => {
      const key = item.fornecedorId;
      if (!porFornecedor.has(key)) {
        porFornecedor.set(key, {
          fornecedorId: item.fornecedorId,
          fornecedor: item.fornecedor,
          quantidade: 0,
          valorTotal: 0,
          valorPago: 0,
          saldo: 0,
        });
      }

      const totais = porFornecedor.get(key)!;
      totais.quantidade++;
      totais.valorTotal += Number(item.valorTotal);
      totais.valorPago += Number(item.valorTotal) - Number(item.saldo);
      totais.saldo += Number(item.saldo);
    });

    return Array.from(porFornecedor.values()).sort((a, b) =>
      a.fornecedor.localeCompare(b.fornecedor),
    );
  }

  private calcularTotaisPorPeriodo(itens: ItemRelatorioContasPagar[]): TotaisPorPeriodo[] {
    const porPeriodo = new Map<string, TotaisPorPeriodo>();

    itens.forEach((item) => {
      const periodo = this.formatarPeriodo(item.dataVencimento);
      if (!porPeriodo.has(periodo)) {
        porPeriodo.set(periodo, {
          periodo,
          quantidade: 0,
          valorTotal: 0,
          valorPago: 0,
          saldo: 0,
        });
      }

      const totais = porPeriodo.get(periodo)!;
      totais.quantidade++;
      totais.valorTotal += Number(item.valorTotal);
      totais.valorPago += Number(item.valorTotal) - Number(item.saldo);
      totais.saldo += Number(item.saldo);
    });

    return Array.from(porPeriodo.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private formatarPeriodo(data: Date): string {
    const date = new Date(data);
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }

  // Métodos auxiliares para exportação
  formatarData(data: Date | undefined): string {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  formatarStatus(status: StatusContaPagar): string {
    const statusMap: Record<StatusContaPagar, string> = {
      [StatusContaPagar.PENDENTE]: 'Pendente',
      [StatusContaPagar.VENCIDA]: 'Vencida',
      [StatusContaPagar.PAGA]: 'Paga',
      [StatusContaPagar.PARCIALMENTE_PAGA]: 'Parcialmente Paga',
    };
    return statusMap[status] || status;
  }
}
