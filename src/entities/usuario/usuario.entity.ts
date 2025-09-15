import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UsuarioRepository } from '../../usuario/usuario.repository';

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
  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  atualizadoEm!: Date;
}
