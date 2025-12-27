import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import * as bcrypt from 'bcryptjs';
import { UsuarioService } from '../usuario/usuario.service';
import { Usuario } from '../entities/usuario/usuario.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuarioService: UsuarioService,
    private readonly em: EntityManager,
    private readonly auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, request?: any): Promise<LoginResponseDto> {
    const user: Usuario = await this.validateLogin(loginDto);

    const ipAddress = request
      ? AuditService.extractIpAddress(request)
      : undefined;
    const userAgent = request
      ? AuditService.extractUserAgent(request)
      : undefined;

    if (!user) {
      await this.auditService.logLoginAttempt(
        loginDto.email,
        false,
        ipAddress,
        userAgent,
        'Usuário ou senha inválido',
      );

      throw new BadRequestException('Usuário ou senha inválido');
    }

    const userEmpresas = await this.em.find(
      UsuarioEmpresaFilial,
      {
        usuario: user.id,
      },
      {
        populate: ['empresa'],
      },
    );

    const empresas = userEmpresas.map((ue) => ({
      empresaId: ue.empresa.id,
      clienteId: ue.empresa.cliente_id,
      isFilial: ue.filial,
      sedeId: ue.empresa.sede?.id || null,
    }));

    // Busca permissões do usuário
    const permissoes = await this.getUserPermissions(user.id);

    const payload = {
      username: user.email,
      sub: user.id,
      empresas,
      permissoes,
    };

    const loginResponseDto = new LoginResponseDto();
    loginResponseDto.token = this.jwtService.sign(payload);
    loginResponseDto.permissoes = permissoes;

    await this.auditService.logLoginAttempt(
      loginDto.email,
      true,
      ipAddress,
      userAgent,
      undefined,
      user.id,
    );

    return loginResponseDto;
  }

  async validateLogin(loginDto: LoginDto): Promise<Usuario> {
    const { email, password } = loginDto;

    const user = await this.usuarioService.getByEmail(email);

    if (!user || !(await this.comparePasswords(password, user.senha))) {
      return null;
    }

    return user;
  }

  /**
   * Logout do usuário (registra no audit log)
   */
  async logout(user: any, request?: any): Promise<void> {
    const ipAddress = request
      ? AuditService.extractIpAddress(request)
      : undefined;
    const userAgent = request
      ? AuditService.extractUserAgent(request)
      : undefined;

    await this.auditService.logLogout(
      user.sub || user.id,
      user.username || user.email,
      ipAddress,
      userAgent,
    );
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Obtém todas as permissões do usuário combinando todos os seus perfis
   */
  async getUserPermissions(
    userId: string,
  ): Promise<Record<string, string[]>> {
    const userPerfis = await this.em.find(
      UsuarioPerfil,
      { usuario: userId, ativo: true },
      { populate: ['perfil'] },
    );

    // Combina permissões de todos os perfis do usuário
    const combinedPermissions: Record<string, Set<string>> = {};

    for (const usuarioPerfil of userPerfis) {
      const permissoes = usuarioPerfil.perfil?.permissoes;
      if (permissoes && typeof permissoes === 'object') {
        for (const [module, actions] of Object.entries(permissoes)) {
          if (Array.isArray(actions)) {
            if (!combinedPermissions[module]) {
              combinedPermissions[module] = new Set();
            }
            actions.forEach((action: string) =>
              combinedPermissions[module].add(action),
            );
          }
        }
      }
    }

    // Converte Sets para arrays
    const result: Record<string, string[]> = {};
    for (const [module, actions] of Object.entries(combinedPermissions)) {
      result[module] = Array.from(actions);
    }

    return result;
  }
}
