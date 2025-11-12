import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../src/auth/roles.guard';
import { UsuarioPerfilService } from '../../src/usuario-perfil/usuario-perfil.service';
import { UsuarioPerfil } from '../../src/entities/usuario-perfil/usuario-perfil.entity';
import { Perfil } from '../../src/entities/perfil/perfil.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let usuarioPerfilService: UsuarioPerfilService;
  let auditService: AuditService;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockUsuarioPerfilService = {
    findByCliente: jest.fn(),
  };

  const mockAuditService = {
    logAccessDeniedNoRole: jest.fn(),
  };

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          method: 'GET',
          url: '/test',
          route: { path: '/test' },
          ip: '127.0.0.1',
          headers: {},
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: UsuarioPerfilService,
          useValue: mockUsuarioPerfilService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    usuarioPerfilService =
      module.get<UsuarioPerfilService>(UsuarioPerfilService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('deve permitir acesso quando nenhuma role é requerida', async () => {
      mockReflector.get.mockReturnValue(undefined);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.get).toHaveBeenCalledWith(
        'roles',
        context.getHandler(),
      );
    });

    it('deve bloquear acesso quando usuário não está autenticado', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);

      const context = createMockExecutionContext(null);
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('deve permitir acesso quando usuário tem o perfil requerido', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);

      const mockUsuarioPerfil = new UsuarioPerfil();
      const mockPerfil = new Perfil();
      mockPerfil.nome = 'Administrador';
      mockUsuarioPerfil.perfil = mockPerfil;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil,
      ]);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsuarioPerfilService.findByCliente).toHaveBeenCalledWith(
        'user-id',
      );
    });

    it('deve bloquear acesso quando usuário não tem o perfil requerido', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);

      const mockUsuarioPerfil = new UsuarioPerfil();
      const mockPerfil = new Perfil();
      mockPerfil.nome = 'Visualizador';
      mockUsuarioPerfil.perfil = mockPerfil;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil,
      ]);

      const context = createMockExecutionContext({
        id: 'user-id',
        email: 'test@test.com',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(mockAuditService.logAccessDeniedNoRole).toHaveBeenCalledWith(
        'user-id',
        'test@test.com',
        ['Administrador'],
        ['Visualizador'],
        '/test',
        'GET',
        '127.0.0.1',
      );
    });

    it('deve permitir acesso quando usuário tem um dos perfis requeridos', async () => {
      mockReflector.get.mockReturnValue(['Administrador', 'Editor']);

      const mockUsuarioPerfil = new UsuarioPerfil();
      const mockPerfil = new Perfil();
      mockPerfil.nome = 'Editor';
      mockUsuarioPerfil.perfil = mockPerfil;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil,
      ]);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso quando usuário tem múltiplos perfis incluindo o requerido', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);

      const mockUsuarioPerfil1 = new UsuarioPerfil();
      const mockPerfil1 = new Perfil();
      mockPerfil1.nome = 'Visualizador';
      mockUsuarioPerfil1.perfil = mockPerfil1;

      const mockUsuarioPerfil2 = new UsuarioPerfil();
      const mockPerfil2 = new Perfil();
      mockPerfil2.nome = 'Administrador';
      mockUsuarioPerfil2.perfil = mockPerfil2;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil1,
        mockUsuarioPerfil2,
      ]);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve bloquear acesso quando serviço de perfil retorna array vazio', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);
      mockUsuarioPerfilService.findByCliente.mockResolvedValue([]);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('deve bloquear acesso quando ocorre erro ao buscar perfis', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);
      mockUsuarioPerfilService.findByCliente.mockRejectedValue(
        new Error('Database error'),
      );

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('deve filtrar perfis com valor null', async () => {
      mockReflector.get.mockReturnValue(['Administrador']);

      const mockUsuarioPerfil1 = new UsuarioPerfil();
      mockUsuarioPerfil1.perfil = null;

      const mockUsuarioPerfil2 = new UsuarioPerfil();
      const mockPerfil2 = new Perfil();
      mockPerfil2.nome = 'Administrador';
      mockUsuarioPerfil2.perfil = mockPerfil2;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil1,
        mockUsuarioPerfil2,
      ]);

      const context = createMockExecutionContext({ id: 'user-id' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('matchRoles', () => {
    it('deve retornar true quando roles coincidem', async () => {
      const mockUsuarioPerfil = new UsuarioPerfil();
      const mockPerfil = new Perfil();
      mockPerfil.nome = 'Administrador';
      mockUsuarioPerfil.perfil = mockPerfil;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil,
      ]);

      const result = await guard.matchRoles(['Administrador'], 'user-id');

      expect(result).toBe(true);
    });

    it('deve retornar false quando roles não coincidem', async () => {
      const mockUsuarioPerfil = new UsuarioPerfil();
      const mockPerfil = new Perfil();
      mockPerfil.nome = 'Visualizador';
      mockUsuarioPerfil.perfil = mockPerfil;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil,
      ]);

      const result = await guard.matchRoles(['Administrador'], 'user-id');

      expect(result).toBe(false);
    });
  });

  describe('getUserRoles', () => {
    it('deve retornar array de nomes de perfis', async () => {
      const mockUsuarioPerfil1 = new UsuarioPerfil();
      const mockPerfil1 = new Perfil();
      mockPerfil1.nome = 'Administrador';
      mockUsuarioPerfil1.perfil = mockPerfil1;

      const mockUsuarioPerfil2 = new UsuarioPerfil();
      const mockPerfil2 = new Perfil();
      mockPerfil2.nome = 'Editor';
      mockUsuarioPerfil2.perfil = mockPerfil2;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil1,
        mockUsuarioPerfil2,
      ]);

      const result = await guard.getUserRoles('user-id');

      expect(result).toEqual(['Administrador', 'Editor']);
    });

    it('deve retornar array vazio quando ocorre erro', async () => {
      mockUsuarioPerfilService.findByCliente.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await guard.getUserRoles('user-id');

      expect(result).toEqual([]);
    });

    it('deve filtrar perfis undefined ou null', async () => {
      const mockUsuarioPerfil1 = new UsuarioPerfil();
      mockUsuarioPerfil1.perfil = null;

      const mockUsuarioPerfil2 = new UsuarioPerfil();
      const mockPerfil2 = new Perfil();
      mockPerfil2.nome = 'Editor';
      mockUsuarioPerfil2.perfil = mockPerfil2;

      mockUsuarioPerfilService.findByCliente.mockResolvedValue([
        mockUsuarioPerfil1,
        mockUsuarioPerfil2,
      ]);

      const result = await guard.getUserRoles('user-id');

      expect(result).toEqual(['Editor']);
    });
  });
});
