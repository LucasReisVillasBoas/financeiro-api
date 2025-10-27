import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { MovimentacaoBancaria } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';

export class MovimentacaoBancariaRepository extends PostgresEntityRepository<MovimentacaoBancaria> {}
