import { IsOptional, IsDateString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class FluxoCaixaFiltrosDto {
  @IsDateString()
  dataInicio: string;

  @IsDateString()
  dataFim: string;

  @IsOptional()
  @IsUUID()
  contaBancariaId?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  consolidado?: boolean;
}

export interface FluxoCaixaDetalheItem {
  id: string;
  descricao: string;
  valor: number;
  documento: string;
  pessoa: string;
  vencimento?: string;
}

export interface FluxoCaixaLinhaDetalhes {
  entradasRealizadas: FluxoCaixaDetalheItem[];
  entradasPrevistas: FluxoCaixaDetalheItem[];
  saidasRealizadas: FluxoCaixaDetalheItem[];
  saidasPrevistas: FluxoCaixaDetalheItem[];
}

export interface FluxoCaixaLinha {
  data: string;
  entradasRealizadas: number;
  entradasPrevistas: number;
  saidasRealizadas: number;
  saidasPrevistas: number;
  saldoDiarioRealizado: number;
  saldoDiarioPrevisto: number;
  saldoAcumuladoRealizado: number;
  saldoAcumuladoPrevisto: number;
  detalhes?: FluxoCaixaLinhaDetalhes;
}

export interface FluxoCaixaTotais {
  totalEntradasRealizadas: number;
  totalEntradasPrevistas: number;
  totalSaidasRealizadas: number;
  totalSaidasPrevistas: number;
  saldoFinalRealizado: number;
  saldoFinalPrevisto: number;
}

export interface FluxoCaixaContaBancaria {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  descricao: string;
  saldo_inicial: number;
}

export interface FluxoCaixaEmpresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
}

export interface FluxoCaixaResponse {
  linhas: FluxoCaixaLinha[];
  totais: FluxoCaixaTotais;
  contaBancaria?: FluxoCaixaContaBancaria;
  empresa?: FluxoCaixaEmpresa;
}
