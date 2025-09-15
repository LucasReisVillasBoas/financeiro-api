import { PostgresEntityRepository } from '../database/postgres-entity.repository';
import { Usuario } from '../entities/Usuario/Usuario.entity';

export class UsuarioRepository extends PostgresEntityRepository<Usuario> {
  // custom methods
}
