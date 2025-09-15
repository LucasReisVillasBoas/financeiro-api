import {
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
  Index,
} from '@mikro-orm/core';
import { Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EmpresaRepository } from '../../empresa/empresa.repository';
import { Endereco } from '../endereco/endereco.entity';

@Entity({ repository: () => EmpresaRepository })
export class Empresa {
  [EntityRepositoryType]?: EmpresaRepository;

  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Index()
  @ManyToOne(() => Empresa, { nullable: true })
  matriz?: Empresa;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Endereco, { nullable: true })
  endereco?: Endereco;

  @Expose()
  @ApiProperty()
  @Property({ length: 60 })
  razaoSocial!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  nomeFantasia?: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 14 })
  cnpjCpf!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 14, nullable: true })
  inscricaoEstadual?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 15, nullable: true })
  inscricaoMunicipal?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  site?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ nullable: true })
  matrizFilial?: string;

  @Expose()
  @ApiProperty()
  @Property()
  abertura!: Date;

  @Expose()
  @ApiProperty({ default: true })
  @Property({ default: true })
  ativo: boolean = true;

  @Exclude()
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

  // Poderia ter relações OneToMany para contatos, documentos, etc, se desejar
}
