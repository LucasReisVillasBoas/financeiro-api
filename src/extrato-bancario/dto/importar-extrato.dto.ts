import { IsUUID, IsString, IsEnum } from 'class-validator';

export enum FormatoExtrato {
  OFX = 'OFX',
  CSV = 'CSV',
}

export class ImportarExtratoDto {
  @IsUUID()
  contaBancariaId!: string;

  @IsEnum(FormatoExtrato)
  formato!: FormatoExtrato;

  @IsString()
  nomeArquivo!: string;

  // O conteúdo do arquivo virá como string base64 ou buffer
  conteudo!: Buffer;
}

export interface TransacaoExtrato {
  data: Date;
  descricao: string;
  documento?: string;
  valor: number;
  tipo: 'debito' | 'credito';
}

export interface ResultadoImportacao {
  totalImportado: number;
  comSugestao: number;
  semSugestao: number;
  itens: ItemExtratoImportado[];
}

export interface ItemExtratoImportado {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
  status: 'pendente' | 'sugestao' | 'conciliado' | 'ignorado';
  sugestao?: SugestaoMatch;
}

export interface SugestaoMatch {
  movimentacaoId: string;
  score: number;
  razoes: string[];
  movimentacao: {
    id: string;
    data: Date;
    descricao: string;
    valor: number;
    tipo: string;
  };
}
