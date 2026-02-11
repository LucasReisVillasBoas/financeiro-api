import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { ContasBancarias } from '../conta-bancaria/conta-bancaria.entity';
import { PlanoContas } from '../plano-contas/plano-contas.entity';
import { MovimentacoesBancariasRepository } from '../../movimentacao-bancaria/movimentacao-bancaria.repository';
import { EncryptedDecimalType } from '../../common/encryption';

export enum TipoMovimento {
  CREDITO = 'Crédito',
  DEBITO = 'Débito',
  // Mantendo compatibilidade com dados antigos
  ENTRADA = 'Entrada',
  SAIDA = 'Saída',
}

export enum TipoReferencia {
  PAGAR = 'Pagar',
  RECEBER = 'Receber',
  MANUAL = 'Manual',
}

@Entity({ repository: () => MovimentacoesBancariasRepository })
export class MovimentacoesBancarias {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'date', fieldName: 'data_movimento' })
  dataMovimento!: Date;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  @Property({ type: 'varchar', length: 255 })
  conta!: string;

  @Property({ type: 'varchar', length: 255 })
  categoria!: string;

  @Property({ type: 'numeric' })
  valor!: number;

  @Property({ type: 'varchar', length: 20, fieldName: 'tipo_movimento' })
  tipoMovimento!: TipoMovimento;

  @Property({ type: 'text', nullable: true })
  observacao?: string;

  @Property({ type: 'char', length: 1, default: 'N' })
  conciliado: string = 'N';

  @Property({ type: 'timestamp', nullable: true, fieldName: 'conciliado_em' })
  conciliadoEm?: Date;

  @Property({ type: 'uuid', nullable: true, fieldName: 'conciliado_por' })
  conciliadoPor?: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  referencia?: TipoReferencia;

  // Propriedade computada para compatibilidade com código antigo
  // @deprecated Use tipoMovimento instead
  get tipo(): string {
    return this.tipoMovimento;
  }

  set tipo(value: string) {
    this.tipoMovimento = value as TipoMovimento;
  }

  // Propriedade computada para compatibilidade com código antigo
  // @deprecated Use dataMovimento instead
  get data(): Date {
    return this.dataMovimento;
  }

  set data(value: Date) {
    this.dataMovimento = value;
  }

  @ManyToOne(() => ContasBancarias, { fieldName: 'conta_bancaria_id' })
  contaBancaria!: ContasBancarias;

  @Property({ type: 'uuid', nullable: true })
  empresaId?: string;

  @ManyToOne(() => PlanoContas, {
    fieldName: 'plano_contas_id',
    nullable: true,
  })
  planoContas?: PlanoContas;

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
