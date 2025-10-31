import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  Matches,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export enum TipoConta {
  CORRENTE = 'Conta Corrente',
  POUPANCA = 'Conta Poupança',
  SALARIO = 'Conta Salário',
  INVESTIMENTO = 'Conta Investimento',
}

export class CreateContaBancariaDto {
  @IsString()
  @IsNotEmpty({ message: 'Cliente ID é obrigatório' })
  cliente_id!: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Empresa ID é obrigatória' })
  empresaId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Banco é obrigatório' })
  banco!: string;

  @IsString()
  @IsNotEmpty({ message: 'Agência é obrigatória' })
  @Matches(/^\d+$/, { message: 'Agência deve conter apenas números' })
  agencia!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'Dígito da agência deve conter apenas números' })
  agencia_digito?: string;

  @IsString()
  @IsNotEmpty({ message: 'Conta é obrigatória' })
  @Matches(/^\d+$/, { message: 'Conta deve conter apenas números' })
  conta!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'Dígito da conta deve conter apenas números' })
  conta_digito?: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  descricao!: string;

  @IsEnum(TipoConta, {
    message:
      'Tipo de conta deve ser: Conta Corrente, Conta Poupança, Conta Salário ou Conta Investimento',
  })
  tipo!: string;

  @IsNumber({}, { message: 'Saldo inicial deve ser um número válido' })
  @IsNotEmpty({ message: 'Saldo inicial é obrigatório' })
  saldo_inicial!: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Data de referência do saldo é obrigatória' })
  data_referencia_saldo!: string;
}
