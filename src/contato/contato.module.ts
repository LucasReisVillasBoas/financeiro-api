import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Contato } from '../entities/contato/contato.entity';
import { ContatoController } from './contato.controller';
import { ContatoService } from './contato.service';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Usuario } from '../entities/usuario/usuario.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Contato, Empresa, Usuario])],
  controllers: [ContatoController],
  providers: [ContatoService],
  exports: [ContatoService],
})
export class ContatoModule {}
