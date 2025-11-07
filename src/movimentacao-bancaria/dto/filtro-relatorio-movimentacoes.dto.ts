import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsIn,
  IsEnum,
} from 'class-validator';

export enum FormatoExportacao {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export class FiltroRelatorioMovimentacoesDto {
  @IsOptional()
  @IsUUID()
  contaBancariaId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsIn(['S', 'N', 'TODOS'], {
    message: 'Conciliado deve ser S, N ou TODOS',
  })
  conciliado?: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsEnum(FormatoExportacao, {
    message: 'Formato deve ser csv, excel ou pdf',
  })
  formato?: FormatoExportacao;
}
