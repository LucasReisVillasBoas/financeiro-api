import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Perfil } from '../entities/perfil/perfil.entity';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';
import { UsuarioPerfilRepository } from '../usuario-perfil/usuario-perfil.repository';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioEmpresaFilialRepository } from '../usuario/usuario-empresa-filial.repository';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { EmpresaService } from '../empresa/empresa.service';

@Global()
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Perfil,
      UsuarioPerfil,
      Usuario,
      UsuarioEmpresaFilial,
      Empresa,
    ]),
  ],
  providers: [
    PerfilService,
    UsuarioPerfilRepository,
    UsuarioEmpresaFilialRepository,
    EmpresaService,
  ],
  controllers: [PerfilController],
  exports: [
    PerfilService,
    UsuarioPerfilRepository,
    UsuarioEmpresaFilialRepository,
    EmpresaService,
  ],
})
export class PerfilModule {}
