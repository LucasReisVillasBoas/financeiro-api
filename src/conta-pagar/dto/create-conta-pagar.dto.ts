import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

export enum StatusContaPagar {
  PENDENTE = 'Pendente',
  VENCIDA = 'Vencida',
  PAGA = 'Paga',
}

export class CreateContaPagarDto {
  @IsString()
  descricao!: string;

  @IsNumber()
  @Min(0)
  valor!: number;

  @IsDateString()
  vencimento!: string;

  @IsEnum(StatusContaPagar, {
    message: 'Status deve ser: Pendente, Vencida ou Paga',
  })
  status: string = StatusContaPagar.PENDENTE;

  @IsString()
  fornecedor!: string;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
