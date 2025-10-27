import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContaPagar } from '../entities/conta-pagar/conta-pagar.entity';

export class ContaPagarRepository extends PostgresEntityRepository<ContaPagar> {}
