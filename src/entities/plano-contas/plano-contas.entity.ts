import {
  Entity,
  Property,
  ManyToOne,
  PrimaryKey,
  Index,
  Unique,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { PlanoContasRepository } from '../../plano-contas/plano-contas.repository';

export enum TipoPlanoContas {
  RECEITA = 'Receita',
  CUSTO = 'Custo',
  DESPESA = 'Despesa',
  OUTROS = 'Outros',
}

@Entity({ repository: () => PlanoContasRepository })
export class PlanoContas {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Empresa, { nullable: false, fieldName: 'empresa_id' })
  @Index()
  empresa!: Empresa;

  @Property({ type: 'varchar', length: 50 })
  @Index()
  codigo!: string;

  @Property({ type: 'varchar', length: 255 })
  descricao!: string;

  @Property({ type: 'varchar', length: 50 })
  @Index()
  tipo!: TipoPlanoContas;

  @ManyToOne(() => PlanoContas, { nullable: true, fieldName: 'parent_id' })
  @Index()
  parent?: PlanoContas;

  @OneToMany(() => PlanoContas, (conta) => conta.parent)
  filhos = new Collection<PlanoContas>(this);

  @Property({ type: 'int' })
  nivel!: number;

  @Property({ type: 'boolean', default: true })
  permite_lancamento: boolean = true;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({
    type: 'timestamp',
    onUpdate: () => new Date(),
    onCreate: () => new Date(),
  })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  deletado_em?: Date;
}
