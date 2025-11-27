import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class RelatorioDreFiltrosDto {
  @IsDateString()
  dataInicio: string;

  @IsDateString()
  dataFim: string;

  @IsUUID()
  empresaId: string;

  @IsOptional()
  @IsUUID()
  centroCustoId?: string;
}

export interface DreItemLinha {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'RECEITA' | 'CUSTO' | 'DESPESA' | 'RESULTADO';
  nivel: number;
  parentId?: string;
  valor: number;
  percentual?: number;
  filhos?: DreItemLinha[];
}

export interface DreTotalizadores {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  margemBruta: number;
  despesasOperacionais: number;
  resultadoOperacional: number;
  outrasReceitasDespesas: number;
  resultadoAntesImpostos: number;
  impostos: number;
  resultadoLiquido: number;
}

export interface RelatorioDreResponse {
  itens: DreItemLinha[];
  totalizadores: DreTotalizadores;
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  empresa: {
    id: string;
    razao_social: string;
    nome_fantasia: string;
  };
  centroCusto?: {
    id: string;
    descricao: string;
  };
}
