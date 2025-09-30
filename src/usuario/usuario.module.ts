import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { EmpresaModule } from '../empresa/empresa.module';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { UsuarioPerfilModule } from '../usuario-perfil/usuario-perfil.module';
import { Cidade } from '../entities/cidade/cidade.entity';
import { Contato } from '../entities/contato/contato.entity';
import { UsuarioContato } from '../entities/usuario-contato/usuario-contato.entity';
import { CidadeService } from '../cidade/cidade.service';
import { ContatoService } from '../contato/contato.service';

@Global()
@Module({
  imports: [
    MikroOrmModule.forFeature([Usuario, UsuarioEmpresaFilial, Empresa, Cidade, Contato, UsuarioContato]),
    UsuarioPerfilModule
  ],
  providers: [UsuarioService, CidadeService, ContatoService],
  controllers: [UsuarioController],
  exports: [UsuarioService],
})
export class UsuarioModule {}
