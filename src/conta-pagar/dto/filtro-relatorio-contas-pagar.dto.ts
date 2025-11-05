import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { StatusContaPagar } from '../../entities/conta-pagar/conta-pagar.entity';

export class FiltroRelatorioContasPagarDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID do fornecedor inválido' })
  fornecedorId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data inicial inválida' })
  dataInicial?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data final inválida' })
  dataFinal?: string;

  @IsOptional()
  @IsEnum(StatusContaPagar, { message: 'Status inválido' })
  status?: StatusContaPagar;

  @IsOptional()
  @IsUUID('4', { message: 'ID da empresa inválido' })
  empresaId?: string;
}
