import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { PerfilRepository } from '../../perfil/perfil.repository';

@Entity({ repository: () => PerfilRepository })
export class Perfil {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  @ApiProperty()
  id!: string;

  @Property()
  @ApiProperty({ example: 1, description: 'ID do cliente dono do perfil' })
  clienteId!: string;

  @Property()
  @ApiProperty({ example: 'Administrador', description: 'Nome do perfil' })
  nome!: string;

  @Property({ type: 'jsonb' })
  @ApiProperty({
    example: {
      usuarios: ['criar', 'editar', 'listar'],
      relatorios: ['visualizar'],
    },
    description: 'Permissões do perfil por módulo/ação',
  })
  permissoes!: Record<string, string[]>;

  @Property({ default: false })
  @ApiProperty({
    example: false,
    description: 'Indica se é o perfil master admin (criador da conta). Não pode ser editado ou excluído.',
  })
  masterAdmin: boolean = false;

  @Property({ default: true })
  ativo: boolean = true;

  @Property({ nullable: true })
  deletadoEm?: Date | null;
}
