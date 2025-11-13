import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BaixaRecebimento } from '../entities/baixa-recebimento/baixa-recebimento.entity';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { BaixaRecebimentoController } from './baixa-recebimento.controller';
import { BaixaRecebimentoService } from './baixa-recebimento.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      BaixaRecebimento,
      ContasReceber,
      ContasBancarias,
      MovimentacoesBancarias,
    ]),
    AuditModule,
  ],
  controllers: [BaixaRecebimentoController],
  providers: [BaixaRecebimentoService],
  exports: [BaixaRecebimentoService],
})
export class BaixaRecebimentoModule {}
