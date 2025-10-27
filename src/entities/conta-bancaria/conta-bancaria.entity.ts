import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { ContaBancariaRepository } from '../../conta-bancaria/conta-bancaria.repository';

@Entity({ repository: () => ContaBancariaRepository })
export class ContaBancaria {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  banco!: string;

  @Property({ type: 'varchar', length: 50 })
  agencia!: string;

  @Property({ type: 'varchar', length: 50 })
  conta!: string;

  @Property({ type: 'varchar', length: 50 })
  tipoConta!: string; // Conta Corrente, Conta Poupança, Conta Salário, Conta Investimento

  @Property({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  saldoDisponivel: number = 0;

  @Property({ type: 'boolean', default: true })
  ativo: boolean = true;

  @ManyToOne(() => Empresa, { nullable: true, fieldName: 'empresa_id' })
  empresa?: Empresa;

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
