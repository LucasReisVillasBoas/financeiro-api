import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';

export class ContasPagarRepository extends PostgresEntityRepository<ContasPagar> {}
