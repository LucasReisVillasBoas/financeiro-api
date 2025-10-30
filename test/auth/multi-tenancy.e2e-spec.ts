import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { EntityManager } from '@mikro-orm/postgresql';
import { Usuario } from '../../src/entities/usuario/usuario.entity';
import { Empresa } from '../../src/entities/empresa/empresa.entity';
import { UsuarioEmpresaFilial } from '../../src/entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Perfil } from '../../src/entities/perfil/perfil.entity';
import { UsuarioPerfil } from '../../src/entities/usuario-perfil/usuario-perfil.entity';
import * as bcrypt from 'bcryptjs';

describe('Multi-tenancy E2E Tests', () => {
  let app: INestApplication;
  let em: EntityManager;

  // Usuários de teste
  let usuarioCliente1: Usuario;
  let usuarioCliente2: Usuario;
  let tokenCliente1: string;
  let tokenCliente2: string;

  // Empresas de teste
  let empresaCliente1: Empresa;
  let empresaCliente2: Empresa;

  // Perfil de teste
  let perfilAdmin: Perfil;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    em = moduleFixture.get<EntityManager>(EntityManager);

    // Criar dados de teste
    await setupTestData();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await app.close();
  });

  const setupTestData = async () => {
    const fork = em.fork();

    // Criar perfil Administrador
    perfilAdmin = fork.create(Perfil, {
      nome: 'Administrador',
      descricao: 'Perfil de administrador para testes',
    });

    // Criar empresas para diferentes clientes
    empresaCliente1 = fork.create(Empresa, {
      razao_social: 'Empresa Teste Cliente 1',
      nome_fantasia: 'Empresa 1',
      cnpj: '11111111111111',
      cliente_id: 'cliente-1',
    });

    empresaCliente2 = fork.create(Empresa, {
      razao_social: 'Empresa Teste Cliente 2',
      nome_fantasia: 'Empresa 2',
      cnpj: '22222222222222',
      cliente_id: 'cliente-2',
    });

    // Criar usuários
    const hashedPassword = await bcrypt.hash('senha123', 10);

    usuarioCliente1 = fork.create(Usuario, {
      nome: 'Usuario Cliente 1',
      email: 'usuario1@teste.com',
      senha: hashedPassword,
    });

    usuarioCliente2 = fork.create(Usuario, {
      nome: 'Usuario Cliente 2',
      email: 'usuario2@teste.com',
      senha: hashedPassword,
    });

    await fork.persistAndFlush([
      perfilAdmin,
      empresaCliente1,
      empresaCliente2,
      usuarioCliente1,
      usuarioCliente2,
    ]);

    // Criar vinculação usuário-empresa-filial
    const usuarioEmpresa1 = fork.create(UsuarioEmpresaFilial, {
      usuario: usuarioCliente1,
      empresa: empresaCliente1,
      filial: false,
    });

    const usuarioEmpresa2 = fork.create(UsuarioEmpresaFilial, {
      usuario: usuarioCliente2,
      empresa: empresaCliente2,
      filial: false,
    });

    // Criar vinculação usuário-perfil
    const usuarioPerfil1 = fork.create(UsuarioPerfil, {
      usuario: usuarioCliente1,
      perfil: perfilAdmin,
    });

    const usuarioPerfil2 = fork.create(UsuarioPerfil, {
      usuario: usuarioCliente2,
      perfil: perfilAdmin,
    });

    await fork.persistAndFlush([
      usuarioEmpresa1,
      usuarioEmpresa2,
      usuarioPerfil1,
      usuarioPerfil2,
    ]);
  };

  const cleanupTestData = async () => {
    const fork = em.fork();

    try {
      // Remover dados de teste na ordem correta
      await fork.nativeDelete(UsuarioPerfil, {
        usuario: [usuarioCliente1.id, usuarioCliente2.id],
      });
      await fork.nativeDelete(UsuarioEmpresaFilial, {
        usuario: [usuarioCliente1.id, usuarioCliente2.id],
      });
      await fork.nativeDelete(Usuario, {
        id: [usuarioCliente1.id, usuarioCliente2.id],
      });
      await fork.nativeDelete(Empresa, {
        id: [empresaCliente1.id, empresaCliente2.id],
      });
      await fork.nativeDelete(Perfil, { id: perfilAdmin.id });
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  };

  const login = async (email: string, senha: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: senha })
      .expect(HttpStatus.OK);

    return response.body.data.token;
  };

  beforeEach(async () => {
    // Fazer login antes de cada teste
    tokenCliente1 = await login('usuario1@teste.com', 'senha123');
    tokenCliente2 = await login('usuario2@teste.com', 'senha123');
  });

  describe('Isolamento entre clientes', () => {
    it('deve permitir que usuário acesse dados de sua própria empresa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente1.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(empresaCliente1.id);
    });

    it('deve bloquear acesso de usuário a empresa de outro cliente', async () => {
      await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente2.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('deve permitir que cliente 2 acesse sua própria empresa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente2.id}`)
        .set('Authorization', `Bearer ${tokenCliente2}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(empresaCliente2.id);
    });

    it('deve bloquear acesso de cliente 2 a empresa do cliente 1', async () => {
      await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente1.id}`)
        .set('Authorization', `Bearer ${tokenCliente2}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Isolamento em operações de listagem', () => {
    it('deve listar apenas empresas do cliente autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get(`/empresas/cliente/${empresaCliente1.cliente_id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verificar que apenas empresas do cliente 1 foram retornadas
      const empresaIds = response.body.data.map((e: any) => e.id);
      expect(empresaIds).toContain(empresaCliente1.id);
      expect(empresaIds).not.toContain(empresaCliente2.id);
    });
  });

  describe('Isolamento em operações de atualização', () => {
    it('deve permitir atualização de empresa própria', async () => {
      const response = await request(app.getHttpServer())
        .put(`/empresas/${empresaCliente1.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .send({
          nome_fantasia: 'Empresa 1 Atualizada',
        })
        .expect(HttpStatus.OK);

      expect(response.body.data.nome_fantasia).toBe('Empresa 1 Atualizada');
    });

    it('deve bloquear atualização de empresa de outro cliente', async () => {
      await request(app.getHttpServer())
        .put(`/empresas/${empresaCliente2.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .send({
          nome_fantasia: 'Tentativa de Atualização',
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('Isolamento em operações de deleção', () => {
    it('deve bloquear deleção de empresa de outro cliente', async () => {
      await request(app.getHttpServer())
        .delete(`/empresas/${empresaCliente2.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('deve permitir deleção de empresa própria (com perfil Administrador)', async () => {
      // Criar uma empresa temporária para deletar
      const fork = em.fork();
      const empresaTemp = fork.create(Empresa, {
        razao_social: 'Empresa Temporária',
        nome_fantasia: 'Temp',
        cnpj: '33333333333333',
        cliente_id: 'cliente-1',
      });
      await fork.persistAndFlush(empresaTemp);

      const usuarioEmpresaTemp = fork.create(UsuarioEmpresaFilial, {
        usuario: usuarioCliente1,
        empresa: empresaTemp,
        filial: false,
      });
      await fork.persistAndFlush(usuarioEmpresaTemp);

      await request(app.getHttpServer())
        .delete(`/empresas/${empresaTemp.id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.OK);
    });
  });

  describe('Validação de autenticação', () => {
    it('deve bloquear acesso sem token', async () => {
      await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente1.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve bloquear acesso com token inválido', async () => {
      await request(app.getHttpServer())
        .get(`/empresas/${empresaCliente1.id}`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Validação de perfis (RBAC)', () => {
    it('deve permitir acesso a endpoint que requer perfil Administrador', async () => {
      const response = await request(app.getHttpServer())
        .get(`/empresas/cliente/${empresaCliente1.cliente_id}`)
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .expect(HttpStatus.OK);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('Validação de clienteId em operações', () => {
    it('deve bloquear criação de empresa para outro cliente', async () => {
      await request(app.getHttpServer())
        .post('/empresas')
        .set('Authorization', `Bearer ${tokenCliente1}`)
        .send({
          razao_social: 'Nova Empresa',
          nome_fantasia: 'Nova',
          cnpj: '44444444444444',
          cliente_id: 'cliente-2', // Tentando criar para outro cliente
        })
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
