import { ApiProperty } from '@nestjs/swagger';

export class CreatePerfilDto {
  @ApiProperty({ example: '1', description: 'ID do cliente dono do perfil' })
  clienteId!: string;

  @ApiProperty({ example: 'Administrador', description: 'Nome do perfil' })
  nome!: string;

  @ApiProperty({
    example: {
      usuarios: ['criar', 'editar', 'listar'],
      relatorios: ['visualizar'],
    },
    description: 'Permissões do perfil por módulo/ação',
  })
  permissoes!: Record<string, string[]>;
}
