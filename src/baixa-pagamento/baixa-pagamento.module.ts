import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BaixaPagamentoController } from './baixa-pagamento.controller';
import { BaixaPagamentoService } from './baixa-pagamento.service';
import { BaixaPagamento } from '../entities/baixa-pagamento/baixa-pagamento.entity';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      BaixaPagamento,
      ContasPagar,
      ContasBancarias,
      MovimentacoesBancarias,
    ]),
    AuditModule,
  ],
  controllers: [BaixaPagamentoController],
  providers: [BaixaPagamentoService],
  exports: [BaixaPagamentoService],
})
export class BaixaPagamentoModule {}
