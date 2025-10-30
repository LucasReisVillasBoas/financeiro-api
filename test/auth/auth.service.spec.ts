import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsuarioService } from '../../src/usuario/usuario.service';
import { Usuario } from '../../src/entities/usuario/usuario.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { AuditService } from '../../src/audit/audit.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UsuarioService;
  let entityManager: EntityManager;
  let auditService: AuditService;

  const mockEntityManager = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockAuditService = {
    logLoginAttempt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: UsuarioService,
          useValue: {
            getByEmail: jest.fn(),
          },
        },
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

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UsuarioService>(UsuarioService);
    entityManager = module.get<EntityManager>(EntityManager);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateLogin', () => {
    it('should return user if credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = new Usuario();
      user.email = 'test@example.com';
      user.senha = await bcrypt.hash('password123', 10);

      jest.spyOn(userService, 'getByEmail').mockResolvedValue(user);

      const result = await service.validateLogin(loginDto);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(userService, 'getByEmail').mockResolvedValue(null);

      const result = await service.validateLogin(loginDto);
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = new Usuario();
      user.email = 'test@example.com';
      user.senha = await bcrypt.hash('password123', 10);

      jest.spyOn(userService, 'getByEmail').mockResolvedValue(user);

      const result = await service.validateLogin(loginDto);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return a login response with token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = new Usuario();
      user.id = 'someId';
      user.email = 'test@example.com';
      user.senha = await bcrypt.hash('password123', 10);

      jest.spyOn(service, 'validateLogin').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue('someToken');
      mockEntityManager.find.mockResolvedValue([]);

      const result = await service.login(loginDto);
      expect(result.token).toEqual('someToken');
      expect(service.validateLogin).toHaveBeenCalledWith(loginDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
        empresas: [],
      });
      expect(mockAuditService.logLoginAttempt).toHaveBeenCalledWith(
        'test@example.com',
        true,
        undefined,
        undefined,
      );
    });

    it('should throw BadRequestException if validateLogin returns null', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(service, 'validateLogin').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('Usuário ou senha inválido'),
      );

      expect(mockAuditService.logLoginAttempt).toHaveBeenCalledWith(
        'test@example.com',
        false,
        undefined,
        undefined,
        'Usuário ou senha inválido',
      );
    });
  });
});
