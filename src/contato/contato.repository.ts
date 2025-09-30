import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { Contato } from '../entities/contato/contato.entity';

export class ContatoRepository extends PostgresEntityRepository<Contato> {
  // custom methods
}
