import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

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

  // Obter ConfigService da aplicação (após ser criada)
  const configService = app.get(ConfigService);

  // Obter configurações via ConfigService
  const corsOrigin =
    configService.get<string>('cors.origin') || 'http://localhost:3001';
  const corsCredentials = configService.get<boolean>('cors.credentials') ?? true;
  const port = configService.get<number>('port') || 3000;

  // Configurar CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: corsCredentials,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Financeiro API')
    .setDescription('API de Gestão Financeira')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Iniciar servidor
  await app.listen(port);

  const protocol = httpsEnabled ? 'https' : 'http';
  console.log(`\n🚀 Aplicação rodando em ${protocol}://localhost:${port}`);
  console.log(`📚 Documentação Swagger: ${protocol}://localhost:${port}/api`);
  console.log(`🔒 HTTPS: ${httpsEnabled ? 'Habilitado ✅' : 'Desabilitado ⚠️'}`);
  console.log(`🌐 CORS Origin: ${corsOrigin}\n`);
}

bootstrap();
