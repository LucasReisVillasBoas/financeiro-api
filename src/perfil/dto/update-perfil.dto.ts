import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsObject, IsOptional } from 'class-validator';
import { CreatePerfilDto } from './create-perfil.dto';

export class UpdatePerfilDto extends PartialType(CreatePerfilDto) {
  @ApiPropertyOptional({ description: 'Novo nome do perfil' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'Novas permissões do perfil' })
  @IsObject()
  @IsOptional()
  permissoes?: Record<string, string[]>;
}
