import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { BaixaPagamento } from '../entities/baixa-pagamento/baixa-pagamento.entity';
import { ContasPagarController } from './conta-pagar.controller';
import { ContasPagarService } from './conta-pagar.service';
import { RelatorioContasPagarController } from './relatorio-contas-pagar.controller';
import { RelatorioContasPagarService } from './relatorio-contas-pagar.service';
import { ExportacaoContasPagarService } from './exportacao-contas-pagar.service';
import { AuditModule } from '../audit/audit.module';
import { MovimentacoesBancariasModule } from '../movimentacao-bancaria/movimentacao-bancaria.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { PlanoContasModule } from '../plano-contas/plano-contas.module';
import { EmpresaModule } from '../empresa/empresa.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ContasPagar,
      MovimentacoesBancarias,
      ContasBancarias,
      BaixaPagamento,
    ]),
    AuditModule,
    MovimentacoesBancariasModule,
    PessoaModule,
    PlanoContasModule,
    EmpresaModule,
    UsuarioModule,
  ],
  controllers: [ContasPagarController, RelatorioContasPagarController],
  providers: [
    ContasPagarService,
    RelatorioContasPagarService,
    ExportacaoContasPagarService,
  ],
  exports: [ContasPagarService],
})
export class ContaPagarModule {}
