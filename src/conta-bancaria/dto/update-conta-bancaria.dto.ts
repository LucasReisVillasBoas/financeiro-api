import { PartialType } from '@nestjs/mapped-types';
import { CreateContaBancariaDto, TipoConta } from './create-conta-bancaria.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateContaBancariaDto extends PartialType(
  CreateContaBancariaDto,
) {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsEnum(TipoConta, {
    message:
      'Tipo de conta deve ser: Conta Corrente, Conta Poupança, Conta Salário ou Conta Investimento',
  })
  tipoConta?: string;
}
