import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';

export class MovimentacoesBancariasRepository extends PostgresEntityRepository<MovimentacoesBancarias> {}
