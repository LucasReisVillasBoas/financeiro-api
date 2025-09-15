import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import * as bcrypt from 'bcryptjs';
import { UsuarioService } from '../usuario/usuario.service';
import { Usuario } from '../entities/usuario/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuarioService: UsuarioService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user: Usuario = await this.validateLogin(loginDto);

    if (!user) {
      throw new BadRequestException('error-user-not_found');
    }

    const payload = { username: user.email, sub: user.id };
    const loginResponseDto = new LoginResponseDto();
    loginResponseDto.token = this.jwtService.sign(payload);

    return loginResponseDto;
  }

  /*
   * PRIVATE FUNCTIONS
   */
  async validateLogin(loginDto: LoginDto): Promise<Usuario> {
    const { email, password } = loginDto;

    const user = await this.usuarioService.getByEmail(email);

    if (!user || !(await this.comparePasswords(password, user.senha))) {
      return null;
    }

    return user;
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
