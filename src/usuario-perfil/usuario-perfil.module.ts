import { Global, Module } from '@nestjs/common';
import { UsuarioPerfilController } from './usuario-perfil.controller';
import { UsuarioPerfilService } from './usuario-perfil.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { UsuarioPerfilRepository } from './usuario-perfil.repository';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([UsuarioPerfil, UsuarioEmpresaFilial])],
  providers: [UsuarioPerfilService, UsuarioPerfilRepository],
  controllers: [UsuarioPerfilController],
  exports: [UsuarioPerfilService, UsuarioPerfilRepository],
})
export class UsuarioPerfilModule {}
