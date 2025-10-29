import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';

export class ContasReceberRepository extends PostgresEntityRepository<ContasReceber> {}
