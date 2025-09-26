import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CidadeService } from './cidade.service';
import { CidadeController } from './cidade.controller';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Cidade } from '../entities/cidade/cidade.entity';
import { Usuario } from '../entities/usuario/usuario.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Cidade, Empresa, Usuario])],
  controllers: [CidadeController],
  providers: [CidadeService],
  exports: [CidadeService],
})
export class CidadeModule {}