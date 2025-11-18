import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RelatorioFluxoCaixaController } from './relatorio-fluxo-caixa.controller';
import { RelatorioFluxoCaixaService } from './relatorio-fluxo-caixa.service';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { Empresa } from '../entities/empresa/empresa.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ContasPagar,
      ContasReceber,
      ContasBancarias,
      Empresa,
    ]),
  ],
  controllers: [RelatorioFluxoCaixaController],
  providers: [RelatorioFluxoCaixaService],
  exports: [RelatorioFluxoCaixaService],
})
export class RelatorioFluxoCaixaModule {}
