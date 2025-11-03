import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoPlanoContas } from '../../entities/plano-contas/plano-contas.entity';

export class FilterPlanoContasDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  search?: string; // Busca por código ou descrição

  @IsOptional()
  @IsEnum(TipoPlanoContas)
  tipo?: TipoPlanoContas;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  permite_lancamento?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  nivel?: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  sortBy?: string = 'codigo';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
