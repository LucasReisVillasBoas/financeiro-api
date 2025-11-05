import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { Endereco } from '../endereco/endereco.entity';
import { Usuario } from '../usuario/usuario.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PessoaRepository } from '../../pessoa/pessoa.repository';

@Entity({ repository: () => PessoaRepository })
export class Pessoa {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Empresa)
  empresa!: Empresa;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Endereco)
  endereco!: Endereco;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  razaoNome?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  fantasiaApelido?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 14, nullable: true })
  documento?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 14, nullable: true })
  ieRg?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ nullable: true })
  aniversario?: Date;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 100, nullable: true })
  email?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 20, nullable: true })
  telefone?: string;

  @Expose()
  @ApiProperty({ default: true })
  @Property({ default: true })
  ativo: boolean = true;

  @Property({ nullable: true })
  deletadoEm?: Date;

  @Expose()
  @ApiProperty()
  @Property()
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property()
  atualizadoEm!: Date;

  @Index()
  @ManyToOne(() => Usuario, { nullable: true })
  criadoPor?: Usuario;

  @Index()
  @ManyToOne(() => Usuario, { nullable: true })
  atualizadoPor?: Usuario;
}
