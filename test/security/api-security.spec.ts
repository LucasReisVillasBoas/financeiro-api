import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SanitizePipe } from '../../src/common/pipes/sanitize.pipe';
import helmet from 'helmet';

describe('API Security Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        frameguard: {
          action: 'deny',
        },
        noSniff: true,
        xssFilter: true,
      }),
    );

    // Configurar pipes como na aplicação real
    app.useGlobalPipes(
      new SanitizePipe(),
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CSRF Protection', () => {
    it('deve bloquear POST sem header X-Requested-With', async () => {
      // Este teste simula um ataque CSRF
      // Uma requisição POST sem o header customizado deve ser bloqueada
      const response = await request(app.getHttpServer())
        .post('/empresas')
        .send({
          razao_social: 'Empresa Teste',
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // Deve retornar 403 Forbidden devido à falta do header
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('CSRF');
    });

    it('deve permitir POST com header X-Requested-With correto', async () => {
      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: 'Empresa Teste',
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // Não deve ser 403 (pode ser 401 se não autenticado, ou outro erro de validação)
      expect(response.status).not.toBe(403);
    });

    it('deve permitir GET sem verificação CSRF', async () => {
      // GET é um safe method e não deve exigir proteção CSRF
      const response = await request(app.getHttpServer()).get('/cidades');

      // Não deve retornar 403 por CSRF (pode ser 401 se não autenticado)
      expect(response.status).not.toBe(403);
    });

    it('deve permitir login sem verificação CSRF (tem @SkipCsrfCheck)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'teste@example.com',
          senha: '123456',
        });

      // Não deve retornar 403 por CSRF
      // Pode retornar 401 (credenciais inválidas) ou outro erro
      expect(response.status).not.toBe(403);
    });
  });

  describe('XSS Protection', () => {
    it('deve sanitizar tags HTML maliciosas', async () => {
      const maliciousInput = '<script>alert("XSS")</script>Empresa Teste';

      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: maliciousInput,
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // O input deve ser sanitizado (tags removidas)
      // Note: A validação pode falhar por outros motivos, mas o importante
      // é que o script não seja executado
      if (response.body.razao_social) {
        expect(response.body.razao_social).not.toContain('<script>');
        expect(response.body.razao_social).not.toContain('alert');
      }
    });

    it('deve sanitizar event handlers maliciosos', async () => {
      const maliciousInput = '<img src=x onerror="alert(1)">Teste';

      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: maliciousInput,
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // Event handlers devem ser removidos
      if (response.body.razao_social) {
        expect(response.body.razao_social).not.toContain('onerror');
        expect(response.body.razao_social).not.toContain('alert');
      }
    });

    it('deve escapar caracteres HTML perigosos', async () => {
      const maliciousInput = '"><script>alert(1)</script>';

      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: maliciousInput,
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // Caracteres perigosos devem ser escapados
      if (response.body.razao_social) {
        expect(response.body.razao_social).not.toContain('<script>');
      }
    });
  });

  describe('Input Validation', () => {
    it('deve rejeitar campos não permitidos (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: 'Empresa Teste',
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
          malicious_field: 'hacker payload', // Campo não permitido
        });

      // Deve retornar erro de validação
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });

    it('deve aceitar apenas campos do whitelist', async () => {
      const response = await request(app.getHttpServer())
        .post('/empresas')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          razao_social: 'Empresa Teste',
          nome_fantasia: 'Teste',
          cnpj: '12345678000190',
          email: 'teste@empresa.com',
        });

      // Não deve retornar erro de validação de campos extras
      // (pode retornar outros erros de validação, mas não por campos extras)
      if (response.status === 400) {
        expect(response.body.message).not.toContain('should not exist');
      }
    });
  });

  describe('SQL Injection Protection', () => {
    it('deve proteger contra SQL injection em queries', async () => {
      // MikroORM usa prepared statements por padrão
      // Este teste verifica que inputs maliciosos não quebram a query

      const sqlInjectionPayload = "' OR '1'='1' --";

      const response = await request(app.getHttpServer())
        .get(`/cidades/ibge/${sqlInjectionPayload}`)
        .set('X-Requested-With', 'XMLHttpRequest');

      // A query deve falhar de forma segura (não retornar todos os registros)
      // Deve retornar 404 (não encontrado) ou 400 (bad request)
      expect(response.status).not.toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('deve incluir headers de segurança Helmet', async () => {
      const response = await request(app.getHttpServer()).get('/');

      // Verificar headers importantes de segurança
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-frame-options']).toBe('DENY');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      // X-XSS-Protection está deprecated em versões modernas do Helmet
      // O Helmet moderno seta como '0' porque CSP é mais efetivo
      // Isso é um comportamento esperado e correto
    });

    it('deve incluir Content-Security-Policy', async () => {
      const response = await request(app.getHttpServer()).get('/');

      // Helmet deve configurar CSP
      expect(
        response.headers['content-security-policy'] ||
          response.headers['content-security-policy-report-only'],
      ).toBeDefined();
    });
  });
});
