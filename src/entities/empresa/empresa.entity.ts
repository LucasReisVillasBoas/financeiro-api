import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { EmpresaRepository } from '../../empresa/empresa.repository';
import { Cidade } from '../cidade/cidade.entity';

@Entity({ repository: () => EmpresaRepository })
export class Empresa {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Empresa, { nullable: true })
  @ApiProperty({
    example: 'uuid da sede (ou null se for sede)',
    description: 'FK -> empresa.id (sede/matriz)',
    required: false,
  })
  sede?: Empresa | null;

  @Property()
  @ApiProperty({
    example: 123,
    description: 'Referência ao cliente (cliente_id)',
  })
  cliente_id!: string;

  @Property()
  @ApiProperty({ example: 'Empresa LTDA', description: 'Razão social' })
  razao_social!: string;

  @Property()
  @ApiProperty({ example: 'Nome Fantasia', description: 'Nome fantasia' })
  nome_fantasia!: string;

  @Property()
  @ApiProperty({ example: '12.345.678/0001-90', description: 'CNPJ ou CPF' })
  cnpj_cpf!: string;

  @Property({ nullable: true })
  inscricao_estadual?: string;

  @Property({ nullable: true })
  inscricao_municipal?: string;

  // Endereço
  @Property({ nullable: true })
  cep?: string;

  @Property({ nullable: true })
  logradouro?: string;

  @Property({ nullable: true })
  numero?: string;

  @Property({ nullable: true })
  bairro?: string;

  @Property({ nullable: true })
  complemento?: string;

  @Property({ nullable: true })
  cidade?: string;

  @Property({ nullable: true })
  codigo_ibge?: string;

  @Property({ nullable: true })
  uf?: string;

  // Contatos
  @Property({ nullable: true })
  telefone?: string;

  @Property({ nullable: true })
  celular?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  data_abertura?: Date;

  @Property({ onCreate: () => new Date() })
  data_inclusao: Date = new Date();

  @Property({ default: true })
  ativo: boolean = true;

  @Property({ nullable: true })
  deletadoEm?: Date | null;

  @OneToMany(() => Cidade, cidade => cidade.filial)
  cidades = new Collection<Cidade>(this);
}
