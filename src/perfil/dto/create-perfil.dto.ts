import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreatePerfilDto {
  @ApiProperty({ example: '1', description: 'ID do cliente dono do perfil' })
  @IsString({ message: 'Cliente ID deve ser uma string' })
  @IsNotEmpty({ message: 'Cliente ID é obrigatório' })
  clienteId!: string;

  @ApiProperty({ example: 'Administrador', description: 'Nome do perfil' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({
    example: {
      usuarios: ['criar', 'editar', 'listar'],
      relatorios: ['visualizar'],
    },
    description: 'Permissões do perfil por módulo/ação',
  })
  @IsObject({ message: 'Permissões deve ser um objeto' })
  @IsNotEmpty({ message: 'Permissões é obrigatório' })
  permissoes!: Record<string, string[]>;
}
