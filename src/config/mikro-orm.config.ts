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
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { Auditoria } from '../entities/auditoria/auditoria.entity';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';

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
    UsuarioPerfil,
    ContasBancarias,
    MovimentacoesBancarias,
    ContasPagar,
    ContasReceber,
    Auditoria,
    PlanoContas,
  ],
  migrations: {
    path: 'src/database/migrations',
  },
  seeder: {
    path: 'src/database/seeders',
  },
});
