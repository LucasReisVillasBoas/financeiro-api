import { defineConfig } from '@mikro-orm/postgresql';
import { DATABASE_NAME, DATABASE_PASSWORD, DATABASE_USER } from '../settings';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Contato } from '../entities/contato/contato.entity';
import { TipoContato } from '../entities/contato/tipo-contato.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Endereco } from '../entities/endereco/endereco.entity';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { Perfil } from '../entities/perfil/perfil.entity';

export default defineConfig({
  dbName: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  entities: [
    Usuario,
    Contato,
    TipoContato,
    Empresa,
    UsuarioEmpresaFilial,
    Endereco,
    Pessoa,
    Perfil,
  ],
  migrations: {
    path: 'src/database/migrations',
  },
  seeder: {
    path: 'src/database/seeders',
  },
});
