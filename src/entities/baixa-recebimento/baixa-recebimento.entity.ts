import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  BeforeCreate,
  BeforeUpdate,
  Index,
} from '@mikro-orm/core';
import { ContasReceber } from '../conta-receber/conta-receber.entity';
import { ContasBancarias } from '../conta-bancaria/conta-bancaria.entity';
import { BaixaRecebimentoRepository } from '../../baixa-recebimento/baixa-recebimento.repository';
import { EncryptedDecimalType } from '../../common/encryption';

export enum TipoBaixaRecebimento {
  PARCIAL = 'PARCIAL',
  TOTAL = 'TOTAL',
}

@Entity({
  tableName: 'baixas_recebimento',
  repository: () => BaixaRecebimentoRepository,
})
export class BaixaRecebimento {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Index()
  @ManyToOne(() => ContasReceber, { fieldName: 'conta_receber_id', nullable: false })
  contaReceber!: ContasReceber;

  @Index()
  @ManyToOne(() => ContasBancarias, { fieldName: 'conta_bancaria_id', nullable: false })
  contaBancaria!: ContasBancarias;

  @Property({ type: 'date' })
  data!: Date;

  @Property({ type: EncryptedDecimalType })
  valor!: number;

  @Property({ type: EncryptedDecimalType, default: 0 })
  acrescimos: number = 0;

  @Property({ type: EncryptedDecimalType, default: 0 })
  descontos: number = 0;

  @Property({ type: EncryptedDecimalType })
  total!: number;

  @Property({ type: 'varchar', length: 20 })
  tipo!: TipoBaixaRecebimento;

  @Property({ type: 'text', nullable: true })
  observacao?: string;

  // Referência ao movimento bancário gerado
  @Property({ type: 'uuid', nullable: true })
  movimentacaoBancariaId?: string;

  // Saldos para controle e auditoria
  @Property({ type: EncryptedDecimalType })
  saldoAnterior!: number;

  @Property({ type: EncryptedDecimalType })
  saldoPosterior!: number;

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

  @Property({ type: 'uuid', nullable: true })
  criadoPorId?: string;

  /**
   * Hook executado antes de criar ou atualizar
   * Calcula o total e define o tipo da baixa
   */
  @BeforeCreate()
  @BeforeUpdate()
  calcularTotal() {
    // Total da baixa = valor + acréscimos - descontos
    this.total = Number((this.valor + this.acrescimos - this.descontos).toFixed(2));

    // Define tipo baseado no saldo posterior
    if (this.saldoPosterior === 0) {
      this.tipo = TipoBaixaRecebimento.TOTAL;
    } else {
      this.tipo = TipoBaixaRecebimento.PARCIAL;
    }
  }
}
