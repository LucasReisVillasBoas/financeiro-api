import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreatePerfilDto {
  @ApiProperty({ example: '1', description: 'ID do cliente dono do perfil' })
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @ApiProperty({ example: 'Administrador', description: 'Nome do perfil' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({
    example: {
      usuarios: ['criar', 'editar', 'listar'],
      relatorios: ['visualizar'],
    },
    description: 'Permissões do perfil por módulo/ação',
  })
  @IsObject()
  @IsNotEmpty()
  permissoes!: Record<string, string[]>;
}
