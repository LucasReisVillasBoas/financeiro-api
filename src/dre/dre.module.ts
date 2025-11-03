import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DreService } from './dre.service';
import { DreController } from './dre.controller';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';
import { EmpresaModule } from '../empresa/empresa.module';

@Module({
  imports: [MikroOrmModule.forFeature([PlanoContas]), EmpresaModule],
  controllers: [DreController],
  providers: [DreService],
  exports: [DreService],
})
export class DreModule {}
