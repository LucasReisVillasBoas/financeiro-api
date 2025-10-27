import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';

export enum StatusContaReceber {
  PENDENTE = 'Pendente',
  RECEBIDA = 'Recebida',
}

export class CreateContaReceberDto {
  @IsString()
  descricao!: string;

  @IsNumber()
  @Min(0)
  valor!: number;

  @IsDateString()
  vencimento!: string;

  @IsEnum(StatusContaReceber, {
    message: 'Status deve ser: Pendente ou Recebida',
  })
  status: string = StatusContaReceber.PENDENTE;

  @IsString()
  cliente!: string;

  @IsOptional()
  @IsDateString()
  dataRecebimento?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
