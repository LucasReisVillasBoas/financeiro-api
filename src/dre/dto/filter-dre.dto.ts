import { IsString, IsDateString, IsOptional } from 'class-validator';

export class FilterDreDto {
  @IsString()
  empresaId!: string;

  @IsDateString()
  dataInicio!: string;

  @IsDateString()
  dataFim!: string;

  @IsOptional()
  @IsString()
  consolidarPor?: 'empresa' | 'filial'; // Para futuras expansões
}
