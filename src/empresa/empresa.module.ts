import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Empresa } from '../entities/empresa/empresa.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { Filial } from '../entities/empresa/filial.entity';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Empresa, Filial])],
  providers: [EmpresaService],
  controllers: [EmpresaController],
  exports: [EmpresaService],
})
export class EmpresaModule {}
