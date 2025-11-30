import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import helmet from 'helmet';

async function bootstrap() {
  // Configuração HTTPS (opcional) - antes de criar a aplicação
  const httpsEnabled = process.env.ENABLE_HTTPS === 'true';
  let httpsOptions = null;

  if (httpsEnabled) {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;

    try {
      httpsOptions = {
        key: fs.readFileSync(path.resolve(keyPath)),
        cert: fs.readFileSync(path.resolve(certPath)),
      };
      console.log('✅ HTTPS habilitado com certificados SSL');
    } catch (error) {
      console.error('❌ Erro ao carregar certificados SSL:', error.message);
      console.error(
        '💡 Dica: Execute "npm run generate:ssl" para gerar certificados de desenvolvimento',
      );
      process.exit(1);
    }
  }

  // Criar aplicação NestJS com ou sem HTTPS
  const app = httpsOptions
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);

  // Configurar Helmet para headers de segurança
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 ano em segundos
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny', // Previne clickjacking
      },
      noSniff: true, // Previne MIME sniffing
      xssFilter: true, // XSS Protection header
    }),
  );

  // Obter ConfigService da aplicação (após ser criada)
  const configService = app.get(ConfigService);

  // Obter configurações via ConfigService
  const corsOrigin =
    configService.get<string>('cors.origin') || 'http://localhost:3003';
  const corsCredentials =
    configService.get<boolean>('cors.credentials') ?? true;
  const port = configService.get<number>('port') || 3000;

  // Configurar CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: corsCredentials,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Configurar Swagger com documentação completa
  const config = new DocumentBuilder()
    .setTitle('Financeiro API')
    .setDescription(`
## API de Gestão Financeira Empresarial

Sistema completo para gestão financeira multi-tenant com suporte a:
- **Contas a Pagar/Receber**: Gestão completa com parcelamento e baixas
- **Movimentações Bancárias**: Controle de contas e conciliação
- **Plano de Contas**: Estrutura hierárquica contábil
- **Relatórios**: DRE, Fluxo de Caixa, Extratos
- **Auditoria**: Log imutável de todas as operações

### Autenticação
Todas as rotas (exceto login) requerem token JWT no header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Multi-Tenancy
O sistema isola dados por empresa. O \`empresaId\` é validado automaticamente.

### Códigos de Resposta
| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 500 | Erro interno |

### Contato
- **Suporte**: suporte@financeiro.com
- **Documentação**: [GitHub Wiki](https://github.com/seu-repo/wiki)
    `)
    .setVersion('1.0.0')
    .setContact('Equipe Financeiro', 'https://financeiro.com', 'dev@financeiro.com')
    .setLicense('Proprietary', 'https://financeiro.com/license')
    .addServer('http://localhost:3002', 'Desenvolvimento Local')
    .addServer('https://api.financeiro.com', 'Produção')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Token JWT obtido via /auth/login',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Empresas', 'Gestão de empresas e filiais')
    .addTag('Usuarios', 'Gestão de usuários')
    .addTag('Pessoas', 'Cadastro de clientes, fornecedores e outros')
    .addTag('Contas Bancárias', 'Gestão de contas bancárias')
    .addTag('Contas a Pagar', 'Gestão de contas a pagar')
    .addTag('Contas a Receber', 'Gestão de contas a receber')
    .addTag('Baixas', 'Liquidação de contas')
    .addTag('Movimentações', 'Movimentações bancárias')
    .addTag('Plano de Contas', 'Estrutura contábil')
    .addTag('Relatórios', 'Relatórios financeiros e contábeis')
    .addTag('Extrato Bancário', 'Importação e conciliação')
    .addTag('Auditoria', 'Logs de auditoria')
    .addTag('Backup', 'Backup e restauração do banco de dados')
    .build();

  // Pipes globais de validação e sanitização
  const { SanitizePipe } = await import('./common/pipes/sanitize.pipe');

  app.useGlobalPipes(
    new SanitizePipe(), // Sanitização XSS - executado primeiro
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Financeiro API - Documentação',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Endpoint para download da especificação OpenAPI em JSON
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  // Endpoint para download da especificação OpenAPI em YAML
  app.getHttpAdapter().get('/api-yaml', async (req, res) => {
    const yaml = await import('js-yaml');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(document));
  });

  // Iniciar servidor
  await app.listen(port);

  const protocol = httpsEnabled ? 'https' : 'http';
  console.log(`\n🚀 Aplicação rodando em ${protocol}://localhost:${port}`);
  console.log(`📚 Documentação Swagger: ${protocol}://localhost:${port}/api`);
  console.log(
    `🔒 HTTPS: ${httpsEnabled ? 'Habilitado ✅' : 'Desabilitado ⚠️'}`,
  );
  console.log(`🌐 CORS Origin: ${corsOrigin}\n`);
}

bootstrap();
