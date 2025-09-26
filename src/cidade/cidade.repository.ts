import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { Cidade } from '../entities/cidade/cidade.entity';

export class CidadeRepository extends PostgresEntityRepository<Cidade> {
  // custom methods
}
