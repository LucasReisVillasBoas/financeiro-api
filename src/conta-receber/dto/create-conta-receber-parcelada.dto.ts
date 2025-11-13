import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
  IsInt,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoContaReceber } from '../../entities/conta-receber/conta-receber.entity';

export class CreateContaReceberParceladaDto {
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
  primeiroVencimento!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Valor total deve ser maior que zero' })
  @Type(() => Number)
  valorTotal!: number;

  @IsInt()
  @Min(1, { message: 'Número de parcelas deve ser no mínimo 1' })
  @Max(999, { message: 'Número de parcelas deve ser no máximo 999' })
  numeroParcelas!: number;

  @IsInt()
  @Min(1, { message: 'Intervalo entre parcelas deve ser no mínimo 1 dia' })
  @Max(365, { message: 'Intervalo entre parcelas deve ser no máximo 365 dias' })
  intervaloDias: number = 30; // Padrão: mensal

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
