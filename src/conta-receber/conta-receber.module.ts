import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContasReceberController } from './conta-receber.controller';
import { ContasReceberService } from './conta-receber.service';
import { RelatorioContasReceberController } from './relatorio-contas-receber.controller';
import { RelatorioContasReceberService } from './relatorio-contas-receber.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([ContasReceber]),
    AuditModule,
  ],
  controllers: [ContasReceberController, RelatorioContasReceberController],
  providers: [ContasReceberService, RelatorioContasReceberService],
  exports: [ContasReceberService, RelatorioContasReceberService],
})
export class ContasReceberModule {}
