import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
  IsInt,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoContaReceber, StatusContaReceber } from '../../entities/conta-receber/conta-receber.entity';

export class CreateContaReceberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao!: string;

  @IsUUID()
  @IsNotEmpty()
  pessoaId!: string;

  @IsUUID()
  @IsNotEmpty()
  planoContasId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documento!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  serie?: string;

  @IsInt()
  @Min(1)
  parcela: number = 1;

  @IsEnum(TipoContaReceber, {
    message: 'Tipo deve ser: BOLETO, DUPLICATA, NOTA_PROMISSORIA, CHEQUE, CARTAO_CREDITO, CARTAO_DEBITO, PIX, DINHEIRO ou OUTROS',
  })
  tipo: TipoContaReceber = TipoContaReceber.BOLETO;

  @IsDateString()
  @IsNotEmpty()
  dataEmissao!: string;

  @IsDateString()
  @IsNotEmpty()
  dataLancamento!: string;

  @IsDateString()
  @IsNotEmpty()
  vencimento!: string;

  @IsOptional()
  @IsDateString()
  dataLiquidacao?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Valor principal deve ser maior ou igual a zero' })
  @Type(() => Number)
  valorPrincipal!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Valor de acréscimos deve ser maior ou igual a zero' })
  @Type(() => Number)
  valorAcrescimos?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Valor de descontos deve ser maior ou igual a zero' })
  @Type(() => Number)
  valorDescontos?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Valor total deve ser maior ou igual a zero' })
  @Type(() => Number)
  valorTotal!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Saldo deve ser maior ou igual a zero' })
  @Type(() => Number)
  saldo!: number;

  @IsOptional()
  @IsEnum(StatusContaReceber, {
    message: 'Status deve ser: PENDENTE, PARCIAL, LIQUIDADO, CANCELADO ou VENCIDO',
  })
  status?: StatusContaReceber;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
