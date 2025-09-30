import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { Usuario } from '../usuario/usuario.entity';
import { Contato } from '../contato/contato.entity';
import { UsuarioContatoRepository } from '../../usuario/usuario-contato.repository';

@Entity({ repository: () => UsuarioContatoRepository })
export class UsuarioContato {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Usuario)
  @Index()
  usuario!: Usuario;

  @ManyToOne(() => Contato)
  @Index()
  contato!: Contato;

  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;
}
