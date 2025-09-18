import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../usuario/usuario.entity';
import { Perfil } from '../perfil/perfil.entity';
import { UsuarioPerfilRepository } from '../../usuario-perfil/usuario-perfil.repository';
import { Empresa } from '../empresa/empresa.entity';

@Entity({ repository: () => UsuarioPerfilRepository })
export class UsuarioPerfil {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  @ApiProperty()
  id!: string;

  @ManyToOne(() => Usuario)
  @ApiProperty({ description: 'Usuário associado ao perfil' })
  usuario!: Usuario;

  @ManyToOne(() => Empresa)
  @ApiProperty({ description: 'Empresa associada ao usuário' })
  empresa!: Empresa;

  @ManyToOne(() => Perfil)
  @ApiProperty({ description: 'Perfil associado ao usuário' })
  perfil!: Perfil;

  @Property({ default: true })
  @ApiProperty({ example: true })
  ativo: boolean;

  @Property({ nullable: true })
  @ApiProperty({ example: '2025-09-17T12:00:00Z' })
  deletadoEm?: Date | null;

  @ApiProperty({ example: '2025-09-17T12:00:00Z' })
  @Property({ onCreate: () => new Date() })
  criadoEm?: Date = new Date();

  @Property({ onCreate: () => new Date() })
  @ApiProperty({ example: '2025-09-17T12:00:00Z' })
  atualizadoEm?: Date = new Date();
}
