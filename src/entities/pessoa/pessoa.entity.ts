import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
  Enum,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { Endereco } from '../endereco/endereco.entity';
import { Usuario } from '../usuario/usuario.entity';
import { PessoaTipo } from './pessoa-tipo.entity';
import { SituacaoPessoa, TipoContribuinte, SituacaoFinanceira } from './tipo-pessoa.enum';
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
  @ApiProperty({ description: 'ID do cliente (multi-tenancy)', nullable: true })
  @Index()
  @Property({ length: 255, nullable: true })
  clienteId?: string;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Empresa)
  empresa!: Empresa;

  @Expose()
  @ApiProperty({ description: 'Filial (opcional para multi-tenancy)', nullable: true })
  @Index()
  @ManyToOne(() => Empresa, { nullable: true })
  filial?: Empresa;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Endereco)
  endereco!: Endereco;

  @Expose()
  @ApiProperty({
    description: 'Tipos da pessoa (cliente, fornecedor, etc)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        tipo: { type: 'string', enum: ['cliente', 'fornecedor', 'funcionario', 'transportadora', 'medico', 'convenio', 'hospital'] },
        criadoEm: { type: 'string', format: 'date-time' }
      }
    }
  })
  @OneToMany(() => PessoaTipo, (pessoaTipo) => pessoaTipo.pessoa, { eager: true })
  tipos = new Collection<PessoaTipo>(this);

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  razaoNome?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  fantasiaApelido?: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'CNPJ ou CPF (apenas números)' })
  @Property({ length: 14, nullable: true, comment: 'CNPJ ou CPF (apenas números)' })
  documento?: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Inscrição Estadual ou RG' })
  @Property({ length: 20, nullable: true, comment: 'Inscrição Estadual ou RG' })
  ieRg?: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Inscrição Municipal' })
  @Property({ length: 30, nullable: true, comment: 'Inscrição Municipal' })
  im?: string;

  @Expose()
  @ApiProperty({ enum: TipoContribuinte, nullable: true, required: false, description: 'Tipo de contribuinte conforme tabela SEFAZ (1=Contribuinte ICMS, 2=Isento, 9=Não Contribuinte)' })
  @Index()
  @Enum({ items: () => TipoContribuinte, nullable: true })
  @Property({ nullable: true, comment: 'Tipo de contribuinte conforme tabela SEFAZ' })
  tipoContribuinte?: TipoContribuinte;

  @Expose()
  @ApiProperty({ default: true, description: 'Indica se a pessoa é consumidor final (S/N)' })
  @Property({ default: true, comment: 'Indica se a pessoa é consumidor final' })
  consumidorFinal: boolean = true;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Data de aniversário' })
  @Property({ nullable: true, comment: 'Data de aniversário' })
  aniversario?: Date;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Limite de crédito disponível (em reais)', example: 5000.00 })
  @Property({ type: 'decimal', precision: 15, scale: 2, nullable: true, default: 0, comment: 'Limite de crédito disponível para a pessoa (em reais)' })
  limiteCredito?: number;

  @Expose()
  @ApiProperty({ enum: SituacaoFinanceira, description: 'Situação financeira da pessoa (ativo, inativo, bloqueado, suspenso)', default: SituacaoFinanceira.ATIVO })
  @Index()
  @Enum(() => SituacaoFinanceira)
  @Property({ type: 'enum', default: SituacaoFinanceira.ATIVO, comment: 'Situação financeira da pessoa' })
  situacaoFinanceira: SituacaoFinanceira = SituacaoFinanceira.ATIVO;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 100, nullable: true })
  email?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 20, nullable: true })
  telefone?: string;

  @Expose()
  @ApiProperty({ enum: SituacaoPessoa, description: 'Situação da pessoa (ativo, inativo, bloqueado, pendente)' })
  @Index()
  @Enum(() => SituacaoPessoa)
  @Property({ type: 'enum', default: SituacaoPessoa.ATIVO })
  situacao: SituacaoPessoa = SituacaoPessoa.ATIVO;

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
}
