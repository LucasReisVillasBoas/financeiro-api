import { StatusContaPagar } from '../../entities/conta-pagar/conta-pagar.entity';

export interface ItemRelatorioContasPagar {
  id: string;
  documento: string;
  serie?: string;
  parcela: number;
  fornecedor: string;
  fornecedorId: string;
  dataEmissao: Date;
  dataVencimento: Date;
  dataLiquidacao?: Date;
  valorPrincipal: number;
  acrescimos: number;
  descontos: number;
  valorTotal: number;
  saldo: number;
  status: StatusContaPagar;
  empresa: string;
}

export interface TotaisPorFornecedor {
  fornecedorId: string;
  fornecedor: string;
  quantidade: number;
  valorTotal: number;
  valorPago: number;
  saldo: number;
}

export interface TotaisPorPeriodo {
  periodo: string;
  quantidade: number;
  valorTotal: number;
  valorPago: number;
  saldo: number;
}

export interface RelatorioContasPagar {
  filtros: {
    fornecedor?: string;
    dataInicial?: string;
    dataFinal?: string;
    status?: StatusContaPagar;
  };
  itens: ItemRelatorioContasPagar[];
  totais: {
    quantidade: number;
    valorTotal: number;
    valorPago: number;
    saldo: number;
  };
  totaisPorFornecedor: TotaisPorFornecedor[];
  totaisPorPeriodo: TotaisPorPeriodo[];
  dataGeracao: Date;
}
