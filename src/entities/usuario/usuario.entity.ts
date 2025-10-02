import {
  Entity,
  PrimaryKey,
  Property,
  Index,
  OneToMany,
  ManyToOne,
  Collection,
} from '@mikro-orm/core';
import { Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UsuarioRepository } from '../../usuario/usuario.repository';
import { UsuarioEmpresaFilial } from '../usuario-empresa-filial/usuario-empresa-filial.entity';
import { Cidade } from '../cidade/cidade.entity';
import { UsuarioContato } from '../usuario-contato/usuario-contato.entity';

@Entity({ repository: () => UsuarioRepository })
export class Usuario {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 100 })
  nome!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 100, nullable: true })
  cargo?: string;

  @Expose()
  @ApiProperty()
  @Index()
  @Property({ length: 100 })
  login!: string;

  @Exclude()
  @Property({ length: 255 })
  senha!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 14, nullable: true })
  telefone?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 255, nullable: true })
  email?: string;

  @Expose()
  @ApiProperty({ default: true })
  @Property({ default: true })
  ativo: boolean = true;

  @Property({ nullable: true })
  deletadoEm?: Date;

  @Expose()
  @ApiProperty()
  @OneToMany(() => UsuarioEmpresaFilial, (uef) => uef.usuario)
  empresasFiliais = new Collection<UsuarioEmpresaFilial>(this);

  @Expose()
  @ApiProperty({ nullable: true })
  @ManyToOne(() => Cidade, { nullable: true })
  @Index()
  cidade?: Cidade;

  @Expose()
  @ApiProperty()
  @OneToMany(() => UsuarioContato, (uc) => uc.usuario)
  usuarioContatos = new Collection<UsuarioContato>(this);

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  atualizadoEm!: Date;
}
