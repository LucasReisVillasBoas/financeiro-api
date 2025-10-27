import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { ContaBancaria } from '../conta-bancaria/conta-bancaria.entity';
import { MovimentacaoBancariaRepository } from '../../movimentacao-bancaria/movimentacao-bancaria.repository';

@Entity({ repository: () => MovimentacaoBancariaRepository })
export class MovimentacaoBancaria {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'date' })
  data!: Date;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  @Property({ type: 'varchar', length: 255 })
  conta!: string;

  @Property({ type: 'varchar', length: 255 })
  categoria!: string;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  valor!: number;

  @Property({ type: 'varchar', length: 20 })
  tipo!: string; // Entrada ou Saída

  @ManyToOne(() => ContaBancaria, { fieldName: 'conta_bancaria_id' })
  contaBancaria!: ContaBancaria;

  @Property({ type: 'uuid', nullable: true })
  empresaId?: string;

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
