import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Empresa } from '../entities/empresa/empresa.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Empresa, UsuarioEmpresaFilial])],
  providers: [EmpresaService],
  controllers: [EmpresaController],
  exports: [EmpresaService],
})
export class EmpresaModule {}
