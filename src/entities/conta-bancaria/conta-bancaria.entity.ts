import {
  Entity,
  Property,
  ManyToOne,
  PrimaryKey,
  Index,
  Unique,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { ContasBancariasRepository } from '../../conta-bancaria/conta-bancaria.repository';

@Entity({ repository: () => ContasBancariasRepository })
@Unique({
  properties: [
    'cliente_id',
    'empresa',
    'banco',
    'agencia',
    'conta',
    'conta_digito',
  ],
})
@Index({ properties: ['descricao'] })
@Index({ properties: ['banco'] })
@Index({ properties: ['agencia'] })
export class ContasBancarias {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  @Index()
  cliente_id!: string;

  @ManyToOne(() => Empresa, { nullable: false, fieldName: 'empresa_id' })
  @Index()
  empresa!: Empresa;

  @Property({ type: 'varchar', length: 255 })
  @Index()
  banco!: string;

  @Property({ type: 'varchar', length: 50 })
  @Index()
  agencia!: string;

  @Property({ type: 'varchar', length: 5, nullable: true })
  agencia_digito?: string;

  @Property({ type: 'varchar', length: 50 })
  conta!: string;

  @Property({ type: 'varchar', length: 5, nullable: true })
  conta_digito?: string;

  @Property({ type: 'varchar', length: 255 })
  @Index()
  descricao!: string;

  @Property({ type: 'varchar', length: 50 })
  tipo!: string;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  saldo_inicial!: number;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  saldo_atual!: number;

  @Property({ type: 'date' })
  data_referencia_saldo!: Date;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

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
