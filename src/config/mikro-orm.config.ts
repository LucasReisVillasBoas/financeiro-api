import { defineConfig } from '@mikro-orm/postgresql';
import { DATABASE_NAME, DATABASE_PASSWORD, DATABASE_USER } from '../settings';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Contato } from '../entities/contato/contato.entity';
import { TipoContato } from '../entities/contato/tipo-contato.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { EmpresaUsuario } from '../entities/empresa-usuario/empresa-usuario.entity';
import { Endereco } from '../entities/endereco/endereco.entity';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { Filial } from '../entities/empresa/filial.entity';

export default defineConfig({
  dbName: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  entities: [
    Usuario,
    Contato,
    TipoContato,
    Empresa,
    EmpresaUsuario,
    Endereco,
    Pessoa,
    Filial,
  ],
  migrations: {
    path: 'src/database/migrations',
  },
  seeder: {
    path: 'src/database/seeders',
  },
});
