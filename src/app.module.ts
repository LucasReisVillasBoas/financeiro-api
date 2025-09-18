import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/mikro-orm.config';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { PerfilModule } from './perfil/perfil.module';
import { UsuarioPerfilModule } from './usuario-perfil/usuario-perfil.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    EmpresaModule,
    UsuarioModule,
    PerfilModule,
    AuthModule,
    UsuarioPerfilModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
