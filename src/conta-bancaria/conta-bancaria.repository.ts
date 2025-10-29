import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';

export class ContasBancariasRepository extends PostgresEntityRepository<ContasBancarias> {}
