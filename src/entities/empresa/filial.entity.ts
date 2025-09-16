import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { FilialRepository } from '../../empresa/filial.repository';
import { Empresa } from './empresa.entity';

@Entity({ repository: () => FilialRepository })
export class Filial {
  @ApiProperty({ example: 'uuid da filial' })
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Empresa)
  @ApiProperty({ example: 'uuid da empresa', description: 'FK -> empresas.id' })
  empresa!: Empresa;

  @Property()
  @ApiProperty({
    example: 'Razão Social Filial',
    description: 'Razão social da filial',
  })
  razao_social!: string;

  @Property()
  @ApiProperty({
    example: 'Nome Fantasia Filial',
    description: 'Nome fantasia da filial',
  })
  nome_fantasia!: string;

  @Property()
  @ApiProperty({
    example: '12.345.678/0001-90',
    description: 'CNPJ ou CPF da filial',
  })
  cnpj_cpf!: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: '123456789',
    description: 'Inscrição estadual',
    required: false,
  })
  inscricao_estadual?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: '987654321',
    description: 'Inscrição municipal',
    required: false,
  })
  inscricao_municipal?: string;

  // Endereço
  @Property({ nullable: true })
  @ApiProperty({ example: '12345-678', description: 'CEP', required: false })
  cep?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: 'Rua Exemplo',
    description: 'Logradouro',
    required: false,
  })
  logradouro?: string;

  @Property({ nullable: true })
  @ApiProperty({ example: '100', description: 'Número', required: false })
  numero?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: 'Bairro Exemplo',
    description: 'Bairro',
    required: false,
  })
  bairro?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: 'Apto 101',
    description: 'Complemento',
    required: false,
  })
  complemento?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: 'Cidade Exemplo',
    description: 'Cidade',
    required: false,
  })
  cidade?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: '1234567',
    description: 'Código IBGE',
    required: false,
  })
  codigo_ibge?: string;

  @Property({ nullable: true })
  @ApiProperty({ example: 'SP', description: 'UF', required: false })
  uf?: string;

  // Contatos
  @Property({ nullable: true })
  @ApiProperty({
    example: '(11) 1234-5678',
    description: 'Telefone',
    required: false,
  })
  telefone?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: '(11) 98765-4321',
    description: 'Celular',
    required: false,
  })
  celular?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: 'email@filial.com',
    description: 'Email',
    required: false,
  })
  email?: string;

  @Property({ nullable: true })
  @ApiProperty({
    example: '2025-09-15T20:00:00Z',
    description: 'Data de abertura',
    required: false,
  })
  data_abertura?: Date;

  @Property({ onCreate: () => new Date() })
  @ApiProperty({
    example: '2025-09-15T20:00:00Z',
    description: 'Data de inclusão',
    required: false,
  })
  data_inclusao: Date = new Date();

  @Property({ default: true })
  @ApiProperty({ example: true, description: 'Ativo' })
  ativo: boolean = true;

  @Property({ nullable: true })
  @ApiProperty({
    example: '2025-09-16T10:00:00Z',
    description: 'Data de exclusão lógica',
    required: false,
  })
  deletadoEm?: Date | null;
}
