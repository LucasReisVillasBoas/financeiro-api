import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  IsIn,
} from 'class-validator';

export enum TipoMovimentacao {
  CREDITO = 'Crédito',
  DEBITO = 'Débito',
  // Mantendo compatibilidade
  ENTRADA = 'Entrada',
  SAIDA = 'Saída',
}

export enum TipoReferenciaDto {
  PAGAR = 'Pagar',
  RECEBER = 'Receber',
  MANUAL = 'Manual',
}

export class CreateMovimentacoesBancariasDto {
  @IsDateString()
  dataMovimento!: string;

  @IsString()
  descricao!: string;

  @IsString()
  conta!: string;

  @IsString()
  categoria!: string;

  @IsNumber()
  @Min(0)
  valor!: number;

  @IsEnum(TipoMovimentacao, {
    message: 'Tipo deve ser: Crédito, Débito, Entrada ou Saída',
  })
  tipoMovimento!: string;

  @IsUUID()
  contaBancaria!: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsIn(['S', 'N'], {
    message: 'Conciliado deve ser S ou N',
  })
  conciliado?: string;

  @IsOptional()
  @IsEnum(TipoReferenciaDto, {
    message: 'Referência deve ser: Pagar, Receber ou Manual',
  })
  referencia?: string;

  // Campos deprecados para compatibilidade
  // @deprecated Use dataMovimento instead
  @IsOptional()
  @IsDateString()
  data?: string;

  // @deprecated Use tipoMovimento instead
  @IsOptional()
  @IsEnum(TipoMovimentacao)
  tipo?: string;
}
