import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  BeforeCreate,
  BeforeUpdate,
} from '@mikro-orm/core';
import { ContasPagar } from '../conta-pagar/conta-pagar.entity';
import { ContasBancarias } from '../conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../movimentacao-bancaria/movimentacao-bancaria.entity';
import { BaixaPagamentoRepository } from '../../baixa-pagamento/baixa-pagamento.repository';

export enum TipoBaixa {
  PARCIAL = 'Parcial',
  TOTAL = 'Total',
}

@Entity({
  tableName: 'baixas_pagamento',
  repository: () => BaixaPagamentoRepository,
})
export class BaixaPagamento {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => ContasPagar, { fieldName: 'conta_pagar_id' })
  contaPagar!: ContasPagar;

  @ManyToOne(() => ContasBancarias, { fieldName: 'conta_bancaria_id' })
  contaBancaria!: ContasBancarias;

  @Property({ type: 'date' })
  data!: Date;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  valor!: number;

  @Property({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  acrescimos: number = 0;

  @Property({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  descontos: number = 0;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  total!: number;

  @Property({ type: 'varchar', length: 10 })
  tipo!: string; // Parcial ou Total

  @Property({ type: 'text', nullable: true })
  observacao?: string;

  @Property({ type: 'uuid', nullable: true })
  movimentacaoBancariaId?: string;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  saldo_anterior!: number;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  saldo_posterior!: number;

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

  @BeforeCreate()
  @BeforeUpdate()
  calcularTotal() {
    // Total da baixa = valor + acréscimos - descontos
    this.total = this.valor + this.acrescimos - this.descontos;

    // Define tipo baseado no saldo
    if (this.saldo_posterior === 0) {
      this.tipo = TipoBaixa.TOTAL;
    } else {
      this.tipo = TipoBaixa.PARCIAL;
    }
  }
}
