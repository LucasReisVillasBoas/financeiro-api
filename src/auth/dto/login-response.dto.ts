import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsObject, IsOptional } from 'class-validator';

export class LoginResponseDto {
  @Expose()
  @ApiProperty()
  @IsString()
  token: string;

  @Expose()
  @ApiProperty({
    example: {
      empresas: ['criar', 'editar', 'listar'],
      usuarios: ['criar', 'editar', 'listar'],
      relatorios: ['criar', 'editar', 'listar'],
    },
    description: 'Permissões do usuário por módulo',
  })
  @IsOptional()
  @IsObject()
  permissoes?: Record<string, string[]>;
}
