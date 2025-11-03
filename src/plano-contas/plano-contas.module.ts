import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PlanoContasService } from './plano-contas.service';
import { PlanoContasExportService } from './plano-contas-export.service';
import { PlanoContasImportService } from './plano-contas-import.service';
import { PlanoContasController } from './plano-contas.controller';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';
import { EmpresaModule } from '../empresa/empresa.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([PlanoContas]),
    EmpresaModule,
    AuditModule,
  ],
  controllers: [PlanoContasController],
  providers: [
    PlanoContasService,
    PlanoContasExportService,
    PlanoContasImportService,
  ],
  exports: [PlanoContasService],
})
export class PlanoContasModule {}
