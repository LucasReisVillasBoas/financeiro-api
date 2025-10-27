import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContaReceber } from '../entities/conta-receber/conta-receber.entity';

export class ContaReceberRepository extends PostgresEntityRepository<ContaReceber> {}
