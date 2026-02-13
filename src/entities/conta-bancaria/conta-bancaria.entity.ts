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
export class ContasBancarias {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  @Index()
  cliente_id!: string;

  @ManyToOne(() => Empresa, { nullable: false, fieldName: 'empresa_id' })
  @Index()
  empresa!: Empresa;

  @Property({ type: 'varchar', length: 50 })
  banco!: string;

  @Property({ type: 'varchar', length: 50 })
  agencia!: string;

  @Property({ type: 'varchar', length: 50 })
  agencia_digito?: string;

  @Property({ type: 'varchar', length: 50 })
  conta!: string;

  @Property({ type: 'varchar', length: 5 })
  conta_digito?: string;

  @Property({ type: 'varchar', length: 255 })
  descricao!: string;

  @Property({ type: 'varchar', length: 50 })
  tipo!: string;

  @Property({ type: 'numeric' })
  saldo_inicial!: number;

  @Property({ type: 'numeric' })
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
