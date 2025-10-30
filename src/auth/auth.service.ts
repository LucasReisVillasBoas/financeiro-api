import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import * as bcrypt from 'bcryptjs';
import { UsuarioService } from '../usuario/usuario.service';
import { Usuario } from '../entities/usuario/usuario.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
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

    const payload = {
      username: user.email,
      sub: user.id,
      empresas,
    };

    const loginResponseDto = new LoginResponseDto();
    loginResponseDto.token = this.jwtService.sign(payload);

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
}
