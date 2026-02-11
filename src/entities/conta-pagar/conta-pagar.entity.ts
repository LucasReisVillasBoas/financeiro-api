import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  BeforeCreate,
  BeforeUpdate,
} from '@mikro-orm/core';
import { ContasPagarRepository } from '../../conta-pagar/conta-pagar.repository';
import { PlanoContas } from '../plano-contas/plano-contas.entity';
import { Pessoa } from '../pessoa/pessoa.entity';
import { Empresa } from '../empresa/empresa.entity';
import { EncryptedDecimalType } from '../../common/encryption';

export enum StatusContaPagar {
  PENDENTE = 'Pendente',
  VENCIDA = 'Vencida',
  PAGA = 'Paga',
  PARCIALMENTE_PAGA = 'Parcialmente Paga',
}

export enum TipoContaPagar {
  FORNECEDOR = 'Fornecedor',
  EMPRESTIMO = 'Empréstimo',
  IMPOSTO = 'Imposto',
  SALARIO = 'Salário',
  ALUGUEL = 'Aluguel',
  SERVICO = 'Serviço',
  OUTROS = 'Outros',
}

@Entity({ repository: () => ContasPagarRepository })
export class ContasPagar {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  // Campos obrigatórios
  @Property({ type: 'varchar', length: 100 })
  documento!: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  serie?: string;

  @Property({ type: 'int' })
  parcela!: number;

  @Property({ type: 'varchar', length: 50 })
  tipo!: string;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  // Datas obrigatórias
  @Property({ type: 'date' })
  data_emissao!: Date;

  @Property({ type: 'date' })
  vencimento!: Date;

  @Property({ type: 'date' })
  data_lancamento!: Date;

  @Property({ type: 'date', nullable: true })
  data_liquidacao?: Date;

  // Valores
  @Property({ type: 'numeric' })
  valor_principal!: number;

  @Property({ type: EncryptedDecimalType, default: 0 })
  acrescimos: number = 0;

  @Property({ type: EncryptedDecimalType, default: 0 })
  descontos: number = 0;

  @Property({ type: 'numeric' })
  valor_total!: number;

  @Property({ type: 'numeric' })
  saldo!: number;

  @Property({ type: 'varchar', length: 50 })
  status: string = StatusContaPagar.PENDENTE;

  // Relacionamentos
  @ManyToOne(() => Pessoa, { fieldName: 'pessoa_id' })
  pessoa!: Pessoa;

  @ManyToOne(() => PlanoContas, { fieldName: 'plano_contas_id' })
  planoContas!: PlanoContas;

  @ManyToOne(() => Empresa, { fieldName: 'empresa_id' })
  empresa!: Empresa;

  @Property({
    type: 'uuid',
    nullable: true,
    fieldName: 'movimentacao_bancaria_id',
  })
  movimentacaoBancariaId?: string;

  // Auditoria
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

  @Property({ type: 'timestamp', nullable: true })
  canceladoEm?: Date;

  @Property({ type: 'text', nullable: true })
  justificativaCancelamento?: string;

  @BeforeCreate()
  @BeforeUpdate()
  calcularValores() {
    // Calcula valor_total
    this.valor_total = this.valor_principal + this.acrescimos - this.descontos;

    // Se for criação, saldo inicial = valor_total
    if (!this.saldo && this.saldo !== 0) {
      this.saldo = this.valor_total;
    }

    // Não recalcula status se a conta foi cancelada
    if (this.canceladoEm) {
      return;
    }

    // Atualiza status baseado no saldo
    if (this.saldo === 0) {
      this.status = StatusContaPagar.PAGA;
    } else if (this.saldo < this.valor_total && this.saldo > 0) {
      this.status = StatusContaPagar.PARCIALMENTE_PAGA;
    } else if (new Date() > this.vencimento && this.saldo > 0) {
      this.status = StatusContaPagar.VENCIDA;
    }
  }
}
