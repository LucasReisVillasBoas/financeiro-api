import { EntityRepository } from '@mikro-orm/postgresql';
import { Pessoa } from '../entities/pessoa/pessoa.entity';

export class PessoaRepository extends EntityRepository<Pessoa> {}
