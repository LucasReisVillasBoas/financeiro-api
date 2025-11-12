import { Entity, Property, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { ContasReceberRepository } from '../../conta-receber/conta-receber.repository';
import { PlanoContas } from '../plano-contas/plano-contas.entity';

@Entity({ repository: () => ContasReceberRepository })
export class ContasReceber {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  valor!: number;

  @Property({ type: 'date' })
  vencimento!: Date;

  @Property({ type: 'varchar', length: 50 })
  status!: string;

  @Property({ type: 'varchar', length: 255 })
  cliente!: string;

  @Property({ type: 'date', nullable: true })
  dataRecebimento?: Date;

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
