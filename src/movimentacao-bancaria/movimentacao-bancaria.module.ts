import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancariasController } from './movimentacao-bancaria.controller';
import { MovimentacoesBancariasService } from './movimentacao-bancaria.service';
import { RelatorioMovimentacoesController } from './relatorio-movimentacoes.controller';
import { RelatorioMovimentacoesService } from './relatorio-movimentacoes.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([MovimentacoesBancarias, ContasBancarias]),
    AuditModule,
  ],
  controllers: [
    MovimentacoesBancariasController,
    RelatorioMovimentacoesController,
  ],
  providers: [MovimentacoesBancariasService, RelatorioMovimentacoesService],
  exports: [MovimentacoesBancariasService, RelatorioMovimentacoesService],
})
export class MovimentacoesBancariasModule {}
