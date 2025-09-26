import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
  Index,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { CidadeRepository } from '../../cidade/cidade.repository';

@Entity({ repository: () => CidadeRepository })
export class Cidade {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @Index()
  cliente!: Usuario;

  @ManyToOne(() => Empresa, { nullable: true })
  @Index()
  filial?: Empresa;

  @Property({ length: 255 })
  nome!: string;

  @Property({ length: 7 })
  @Index()
  codigoIbge!: string;

  @Property({ length: 2 })
  uf!: string;

  @Property({ length: 100, default: 'Brasil' })
  pais: string = 'Brasil';

  @Property({ length: 10, nullable: true })
  codigoBacen?: string;

  @Property({ type: 'timestamptz', onCreate: () => new Date() })
  criadoEm: Date = new Date();

  @Property({
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  atualizadoEm: Date = new Date();
}
