import { EntityRepository } from '@mikro-orm/postgresql';
import { ExtratoBancario } from '../entities/extrato-bancario/extrato-bancario.entity';

export class ExtratoBancarioRepository extends EntityRepository<ExtratoBancario> {}
