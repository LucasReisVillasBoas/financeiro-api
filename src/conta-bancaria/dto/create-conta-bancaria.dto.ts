import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';

export enum TipoConta {
  CORRENTE = 'Conta Corrente',
  POUPANCA = 'Conta Poupança',
  SALARIO = 'Conta Salário',
  INVESTIMENTO = 'Conta Investimento',
}

export class CreateContaBancariaDto {
  @IsString()
  banco!: string;

  @IsString()
  agencia!: string;

  @IsString()
  conta!: string;

  @IsEnum(TipoConta, {
    message:
      'Tipo de conta deve ser: Conta Corrente, Conta Poupança, Conta Salário ou Conta Investimento',
  })
  tipoConta!: string;

  @IsNumber()
  @Min(0)
  saldoDisponivel: number = 0;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
