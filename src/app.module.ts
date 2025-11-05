import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/mikro-orm.config';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { PerfilModule } from './perfil/perfil.module';
import { UsuarioPerfilModule } from './usuario-perfil/usuario-perfil.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { CidadeModule } from './cidade/cidade.module';
import { ContatoModule } from './contato/contato.module';
import { ContaBancariaModule } from './conta-bancaria/conta-bancaria.module';
import { MovimentacoesBancariasModule } from './movimentacao-bancaria/movimentacao-bancaria.module';
import { ContaPagarModule } from './conta-pagar/conta-pagar.module';
import { ContasReceberModule } from './conta-receber/conta-receber.module';
import { AuditModule } from './audit/audit.module';
import { PlanoContasModule } from './plano-contas/plano-contas.module';
import { DreModule } from './dre/dre.module';
import { BaixaPagamentoModule } from './baixa-pagamento/baixa-pagamento.module';
import { PessoaModule } from './pessoa/pessoa.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(mikroOrmConfig),
    AuditModule,
    EmpresaModule,
    UsuarioModule,
    PerfilModule,
    AuthModule,
    CidadeModule,
    ContatoModule,
    UsuarioPerfilModule,
    ContaBancariaModule,
    MovimentacoesBancariasModule,
    ContaPagarModule,
    ContasReceberModule,
    PlanoContasModule,
    DreModule,
    BaixaPagamentoModule,
    PessoaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'usuario/cadastro', method: RequestMethod.POST },
        { path: 'empresas', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
