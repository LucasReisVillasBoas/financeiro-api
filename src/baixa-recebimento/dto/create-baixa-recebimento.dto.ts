import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBaixaRecebimentoDto {
  @IsUUID()
  @IsNotEmpty()
  contaReceberId!: string;

  @IsUUID()
  @IsNotEmpty()
  contaBancariaId!: string;

  @IsDateString()
  @IsNotEmpty()
  data!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  @Type(() => Number)
  valor!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Acréscimos devem ser maior ou igual a zero' })
  @Type(() => Number)
  acrescimos?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Descontos devem ser maior ou igual a zero' })
  @Type(() => Number)
  descontos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}
