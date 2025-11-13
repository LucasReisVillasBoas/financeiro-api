import { EntityRepository } from '@mikro-orm/postgresql';
import { BaixaRecebimento } from '../entities/baixa-recebimento/baixa-recebimento.entity';

export class BaixaRecebimentoRepository extends EntityRepository<BaixaRecebimento> {}
