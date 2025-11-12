import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';

export class RegistrarBaixaDto {
  @IsUUID('4', { message: 'ID da conta bancária inválido' })
  @IsNotEmpty({ message: 'Conta bancária é obrigatória' })
  contaBancariaId!: string;

  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @Min(0.01, { message: 'Valor pago deve ser maior que zero' })
  valorPago!: number;

  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de pagamento é obrigatória' })
  dataPagamento!: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
