import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Perfil } from '../entities/perfil/perfil.entity';
import { PerfilService } from './perfil.service';
import { PerfilController } from './perfil.controller';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Perfil])],
  providers: [PerfilService],
  controllers: [PerfilController],
  exports: [PerfilService],
})
export class PerfilModule {}
