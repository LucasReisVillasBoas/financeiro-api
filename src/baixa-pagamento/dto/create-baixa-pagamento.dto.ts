import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBaixaPagamentoDto {
  @IsUUID('4', { message: 'ID da conta a pagar inválido' })
  @IsNotEmpty({ message: 'Conta a pagar é obrigatória' })
  contaPagarId!: string;

  @IsUUID('4', { message: 'ID da conta bancária inválido' })
  @IsNotEmpty({ message: 'Conta bancária é obrigatória' })
  contaBancariaId!: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  valor!: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Acréscimos não podem ser negativos' })
  acrescimos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Descontos não podem ser negativos' })
  descontos?: number;

  @IsDateString({}, { message: 'Data deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  data!: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
