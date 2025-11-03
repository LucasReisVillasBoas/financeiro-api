import { TipoPlanoContas } from '../../entities/plano-contas/plano-contas.entity';

export interface DreLinhaDto {
  contaId: string;
  codigo: string;
  descricao: string;
  tipo: TipoPlanoContas;
  nivel: number;
  valor: number;
  parentCodigo?: string;
}

export interface DreTotaisDto {
  totalReceitas: number;
  totalCustos: number;
  totalDespesas: number;
  totalOutros: number;
  lucroOperacional: number; // Receitas - Custos - Despesas
  resultadoLiquido: number; // Lucro Operacional + Outros
}

export class DreResponseDto {
  empresaId: string;
  empresaNome: string;
  dataInicio: string;
  dataFim: string;

  // Linhas agrupadas por tipo
  receitas: DreLinhaDto[];
  custos: DreLinhaDto[];
  despesas: DreLinhaDto[];
  outros: DreLinhaDto[];

  // Totais calculados
  totais: DreTotaisDto;

  // Metadados
  geradoEm: Date;
  totalLancamentos: number;

  constructor(partial: Partial<DreResponseDto>) {
    Object.assign(this, partial);
  }
}

export interface DreConsolidadoDto {
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  empresas: Array<{
    empresaId: string;
    empresaNome: string;
    dre: DreResponseDto;
  }>;
  consolidado: {
    receitas: DreLinhaDto[];
    custos: DreLinhaDto[];
    despesas: DreLinhaDto[];
    outros: DreLinhaDto[];
    totais: DreTotaisDto;
  };
  geradoEm: Date;
}

export interface DreLinhaComparativoDto extends DreLinhaDto {
  variacao: number;
  variacaoPercentual: number;
}

export interface DreTotaisComparativoDto extends DreTotaisDto {
  variacao: {
    receitas: number;
    custos: number;
    despesas: number;
    outros: number;
    lucroOperacional: number;
    resultadoLiquido: number;
  };
  variacaoPercentual: {
    receitas: number;
    custos: number;
    despesas: number;
    outros: number;
    lucroOperacional: number;
    resultadoLiquido: number;
  };
}

export interface DreComparativoDto {
  empresaId: string;
  empresaNome: string;
  periodo1: {
    dataInicio: string;
    dataFim: string;
    dre: DreResponseDto;
  };
  periodo2: {
    dataInicio: string;
    dataFim: string;
    dre: DreResponseDto;
  };
  comparativo: {
    receitas: DreLinhaComparativoDto[];
    custos: DreLinhaComparativoDto[];
    despesas: DreLinhaComparativoDto[];
    outros: DreLinhaComparativoDto[];
    totais: DreTotaisComparativoDto;
  };
  geradoEm: Date;
}
