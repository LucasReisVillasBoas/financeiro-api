import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmpresaGuard } from '../../src/auth/empresa.guard';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsuarioEmpresaFilial } from '../../src/entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Empresa } from '../../src/entities/empresa/empresa.entity';
import { AuditService } from '../../src/audit/audit.service';

describe('EmpresaGuard', () => {
  let guard: EmpresaGuard;
  let entityManager: EntityManager;
  let auditService: AuditService;

  const mockEntityManager = {
    find: jest.fn(),
  };

  const mockAuditService = {
    logAccessDeniedNoEmpresa: jest.fn(),
    logAccessDeniedWrongEmpresa: jest.fn(),
    logAccessDeniedWrongCliente: jest.fn(),
  };

  const createMockExecutionContext = (
    user: any,
    params: any = {},
    body: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          params,
          body,
          userEmpresas: undefined,
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

  const createMockUsuarioEmpresaFilial = (
    empresaId: string,
    clienteId: string,
    isFilial: boolean = false,
    sedeId: string | null = null,
  ): UsuarioEmpresaFilial => {
    const usuarioEmpresaFilial = new UsuarioEmpresaFilial();
    const empresa = new Empresa();
    empresa.id = empresaId;
    empresa.cliente_id = clienteId;
    if (sedeId) {
      const sede = new Empresa();
      sede.id = sedeId;
      empresa.sede = sede;
    }
    usuarioEmpresaFilial.empresa = empresa;
    usuarioEmpresaFilial.filial = isFilial;
    return usuarioEmpresaFilial;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaGuard,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    guard = module.get<EmpresaGuard>(EmpresaGuard);
    entityManager = module.get<EntityManager>(EntityManager);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    describe('Validação de usuário autenticado', () => {
      it('deve bloquear quando usuário não está autenticado', async () => {
        const context = createMockExecutionContext(null);

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Usuário não autenticado'),
        );
      });
    });

    describe('Validação de vinculação empresa/filial', () => {
      it('deve bloquear quando usuário não possui acesso a nenhuma empresa', async () => {
        mockEntityManager.find.mockResolvedValue([]);

        const context = createMockExecutionContext({
          id: 'user-id',
          email: 'test@test.com',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Usuário não possui acesso a nenhuma empresa'),
        );

        expect(mockEntityManager.find).toHaveBeenCalledWith(
          UsuarioEmpresaFilial,
          { usuario: 'user-id' },
          { populate: ['empresa'] },
        );

        expect(mockAuditService.logAccessDeniedNoEmpresa).toHaveBeenCalledWith(
          'user-id',
          'test@test.com',
          '/test',
          'GET',
          '127.0.0.1',
        );
      });

      it('deve adicionar userEmpresas ao request quando usuário tem acesso', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
          false,
          null,
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext({ id: 'user-id' });
        const request = context.switchToHttp().getRequest();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(request.userEmpresas).toEqual([
          {
            empresaId: 'empresa-1',
            clienteId: 'cliente-1',
            isFilial: false,
            sedeId: null,
          },
        ]);
      });

      it('deve incluir sedeId quando empresa é filial', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'filial-1',
          'cliente-1',
          true,
          'sede-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext({ id: 'user-id' });
        const request = context.switchToHttp().getRequest();

        await guard.canActivate(context);

        expect(request.userEmpresas).toEqual([
          {
            empresaId: 'filial-1',
            clienteId: 'cliente-1',
            isFilial: true,
            sedeId: 'sede-1',
          },
        ]);
      });
    });

    describe('Validação de acesso por empresaId', () => {
      it('deve permitir acesso quando empresaId no param pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'empresa-1' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve bloquear acesso quando empresaId no param não pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'empresa-2' },
        );

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Acesso negado a esta empresa'),
        );
      });

      it('deve permitir acesso quando empresaId no body pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          {},
          { empresa_id: 'empresa-1' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve bloquear acesso quando empresaId no body não pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          {},
          { empresa_id: 'empresa-2' },
        );

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Acesso negado a esta empresa'),
        );
      });

      it('deve priorizar empresaId do param sobre body', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'empresa-1' },
          { empresa_id: 'empresa-2' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Validação de acesso por clienteId', () => {
      it('deve permitir acesso quando clienteId no body pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          {},
          { cliente_id: 'cliente-1' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve bloquear acesso quando clienteId no body não pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          {},
          { cliente_id: 'cliente-2' },
        );

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Acesso negado a este cliente'),
        );
      });

      it('deve validar ambos empresaId e clienteId quando presentes', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          {},
          { empresa_id: 'empresa-1', cliente_id: 'cliente-1' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Validação de acesso a filiais', () => {
      it('deve permitir acesso quando sedeId pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'filial-1',
          'cliente-1',
          true,
          'sede-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'sede-1' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve bloquear acesso quando sedeId não pertence ao usuário', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'filial-1',
          'cliente-1',
          true,
          'sede-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'sede-2' },
        );

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Acesso negado a esta empresa'),
        );
      });
    });

    describe('Múltiplas empresas/filiais', () => {
      it('deve permitir acesso quando usuário tem múltiplas empresas e acessa uma delas', async () => {
        const usuarioEmpresaFilial1 = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );
        const usuarioEmpresaFilial2 = createMockUsuarioEmpresaFilial(
          'empresa-2',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([
          usuarioEmpresaFilial1,
          usuarioEmpresaFilial2,
        ]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'empresa-2' },
        );

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve bloquear acesso quando usuário tenta acessar empresa de outro cliente', async () => {
        const usuarioEmpresaFilial1 = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );
        const usuarioEmpresaFilial2 = createMockUsuarioEmpresaFilial(
          'empresa-2',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([
          usuarioEmpresaFilial1,
          usuarioEmpresaFilial2,
        ]);

        const context = createMockExecutionContext(
          { id: 'user-id' },
          { empresaId: 'empresa-3' },
        );

        await expect(guard.canActivate(context)).rejects.toThrow(
          new ForbiddenException('Acesso negado a esta empresa'),
        );
      });
    });

    describe('Cenários sem empresaId ou clienteId', () => {
      it('deve permitir acesso quando nenhum empresaId ou clienteId é fornecido', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext({ id: 'user-id' }, {}, {});

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('deve usar primeira empresa do usuário quando empresaId não é fornecido', async () => {
        const usuarioEmpresaFilial = createMockUsuarioEmpresaFilial(
          'empresa-1',
          'cliente-1',
        );

        mockEntityManager.find.mockResolvedValue([usuarioEmpresaFilial]);

        const context = createMockExecutionContext({ id: 'user-id' }, {}, {});
        const request = context.switchToHttp().getRequest();

        await guard.canActivate(context);

        expect(request.userEmpresas).toBeDefined();
        expect(request.userEmpresas[0].empresaId).toBe('empresa-1');
      });
    });
  });
});
