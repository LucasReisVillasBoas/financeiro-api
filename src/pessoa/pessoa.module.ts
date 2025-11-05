import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { Cidade } from '../entities/cidade/cidade.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [MikroOrmModule.forFeature([Pessoa, Cidade, UsuarioEmpresaFilial]), AuditModule],
  controllers: [PessoaController],
  providers: [PessoaService],
  exports: [PessoaService],
})
export class PessoaModule {}
