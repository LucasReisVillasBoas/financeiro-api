import { Entity, Property, PrimaryKey, ManyToOne, Index, Enum } from '@mikro-orm/core';
import { ContasReceberRepository } from '../../conta-receber/conta-receber.repository';
import { PlanoContas } from '../plano-contas/plano-contas.entity';
import { Pessoa } from '../pessoa/pessoa.entity';
import { Empresa } from '../empresa/empresa.entity';
import { EncryptedDecimalType } from '../../common/encryption';

export enum TipoContaReceber {
  BOLETO = 'BOLETO',
  DUPLICATA = 'DUPLICATA',
  NOTA_PROMISSORIA = 'NOTA_PROMISSORIA',
  CHEQUE = 'CHEQUE',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  OUTROS = 'OUTROS',
}

export enum StatusContaReceber {
  PENDENTE = 'PENDENTE',
  PARCIAL = 'PARCIAL',
  LIQUIDADO = 'LIQUIDADO',
  CANCELADO = 'CANCELADO',
  VENCIDO = 'VENCIDO',
}

@Entity({ tableName: 'contas_receber', repository: () => ContasReceberRepository })
export class ContasReceber {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  // Vínculo obrigatório com Pessoa (cliente)
  @Index()
  @ManyToOne(() => Pessoa, {
    fieldName: 'pessoa_id',
    nullable: false,
  })
  pessoa!: Pessoa;

  // Vínculo obrigatório com Plano de Contas
  @Index()
  @ManyToOne(() => PlanoContas, {
    fieldName: 'plano_contas_id',
    nullable: false,
  })
  planoContas!: PlanoContas;

  // Campos de documento
  @Property({ type: 'varchar', length: 50 })
  documento!: string;

  @Property({ type: 'varchar', length: 10, nullable: true })
  serie?: string;

  @Property({ type: 'int', default: 1 })
  parcela!: number;

  @Enum(() => TipoContaReceber)
  @Property({ type: 'varchar', length: 50, default: TipoContaReceber.BOLETO })
  tipo: TipoContaReceber = TipoContaReceber.BOLETO;

  // Campos de datas
  @Property({ type: 'date' })
  dataEmissao!: Date;

  @Property({ type: 'date' })
  dataLancamento!: Date;

  @Property({ type: 'date' })
  vencimento!: Date;

  @Property({ type: 'date', nullable: true })
  dataLiquidacao?: Date;

  // Campos monetários
  @Property({ type: EncryptedDecimalType })
  valorPrincipal!: number;

  @Property({ type: EncryptedDecimalType, default: 0 })
  valorAcrescimos: number = 0;

  @Property({ type: EncryptedDecimalType, default: 0 })
  valorDescontos: number = 0;

  @Property({ type: EncryptedDecimalType })
  valorTotal!: number;

  @Property({ type: EncryptedDecimalType })
  saldo!: number;

  // Status
  @Enum(() => StatusContaReceber)
  @Property({ type: 'varchar', length: 50, default: StatusContaReceber.PENDENTE })
  status: StatusContaReceber = StatusContaReceber.PENDENTE;

  // Multi-tenancy
  @Index()
  @ManyToOne(() => Empresa, {
    fieldName: 'empresa_id',
    nullable: true,
  })
  empresa?: Empresa;

  // Campos de auditoria
  @Property({ type: 'timestamp', onCreate: () => new Date() })
  criadoEm: Date = new Date();

  @Property({
    type: 'timestamp',
    onUpdate: () => new Date(),
    onCreate: () => new Date(),
  })
  atualizadoEm: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  deletadoEm?: Date;
}
