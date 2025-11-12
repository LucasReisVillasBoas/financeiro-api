import {
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuditQueryDto {
  @ApiPropertyOptional({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'ID da empresa/filial',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @ApiPropertyOptional({
    description: 'Módulo (ex: USUARIO, EMPRESA, AUTH)',
    example: 'USUARIO',
  })
  @IsOptional()
  @IsString()
  modulo?: string;

  @ApiPropertyOptional({
    description: 'Ação (ex: CREATE, UPDATE, DELETE, LOGIN)',
    example: 'DELETE',
  })
  @IsOptional()
  @IsString()
  acao?: string;

  @ApiPropertyOptional({
    description: 'Resultado da operação',
    enum: ['SUCESSO', 'FALHA', 'NEGADO'],
    example: 'SUCESSO',
  })
  @IsOptional()
  @IsEnum(['SUCESSO', 'FALHA', 'NEGADO'])
  resultado?: 'SUCESSO' | 'FALHA' | 'NEGADO';

  @ApiPropertyOptional({
    description: 'Data inicial do período',
    example: '2025-01-01T00:00:00.000Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataInicio?: Date;

  @ApiPropertyOptional({
    description: 'Data final do período',
    example: '2025-12-31T23:59:59.999Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataFim?: Date;

  @ApiPropertyOptional({
    description: 'Limite de registros por página',
    example: 100,
    minimum: 1,
    maximum: 1000,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  @ApiPropertyOptional({
    description: 'Offset para paginação',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
