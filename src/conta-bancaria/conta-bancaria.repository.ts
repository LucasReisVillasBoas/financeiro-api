import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { ContaBancaria } from '../entities/conta-bancaria/conta-bancaria.entity';

export class ContaBancariaRepository extends PostgresEntityRepository<ContaBancaria> {}
