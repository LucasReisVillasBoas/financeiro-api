import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { Empresa } from '../entities/empresa/empresa.entity';

export class EmpresaRepository extends PostgresEntityRepository<Empresa> {
  // custom methods
}
