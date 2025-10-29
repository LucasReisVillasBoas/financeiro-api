import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'Entrada',
  SAIDA = 'Saída',
}

export class CreateMovimentacoesBancariasDto {
  @IsDateString()
  data!: string;

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
    message: 'Tipo deve ser: Entrada ou Saída',
  })
  tipo!: string;

  @IsUUID()
  contaBancaria!: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
