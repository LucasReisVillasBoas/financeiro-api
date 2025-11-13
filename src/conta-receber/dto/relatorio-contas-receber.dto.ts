import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { StatusContaReceber } from '../../entities/conta-receber/conta-receber.entity';

export class RelatorioContasReceberDto {
  @IsOptional()
  @IsUUID()
  pessoaId?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsEnum(StatusContaReceber)
  status?: StatusContaReceber;

  @IsOptional()
  @IsEnum(['emissao', 'vencimento', 'liquidacao'], {
    message: 'tipoPeriodo deve ser: emissao, vencimento ou liquidacao',
  })
  tipoPeriodo?: 'emissao' | 'vencimento' | 'liquidacao' = 'vencimento';
}

export interface RelatorioTotaisDto {
  totalRegistros: number;
  valorTotal: number;
  valorRecebido: number;
  valorPendente: number;
  valorVencido: number;
  totaisPorCliente: {
    pessoaId: string;
    pessoaNome: string;
    totalTitulos: number;
    valorTotal: number;
    valorRecebido: number;
    valorPendente: number;
  }[];
  totaisPorPeriodo: {
    periodo: string; // YYYY-MM
    totalTitulos: number;
    valorTotal: number;
    valorRecebido: number;
    valorPendente: number;
  }[];
}

export interface RelatorioContaReceberItem {
  id: string;
  documento: string;
  serie: string;
  parcela: number;
  tipo: string;
  dataEmissao: Date;
  vencimento: Date;
  dataLiquidacao: Date | null;
  pessoaNome: string;
  pessoaDocumento: string;
  descricao: string;
  valorPrincipal: number;
  valorAcrescimos: number;
  valorDescontos: number;
  valorTotal: number;
  saldo: number;
  status: StatusContaReceber;
  planoContasDescricao: string;
  empresaNome: string;
}
