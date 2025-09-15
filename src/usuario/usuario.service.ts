import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async create(dto: UsuarioCreateRequestDto): Promise<Usuario> {
    // fazer validações: email ja existe, ...
    if (await this.exists(dto.email)) {
      throw new BadRequestException('Email já existe');
    }

    const usuario = this.usuarioRepository.create(dto);

    usuario.senha = await this.hashPassword(dto.senha);
    await this.usuarioRepository.persistAndFlush(usuario);
    return usuario;
  }

  async getByEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ email });
    if (!usuario) throw new NotFoundException('Usuario not found');
    return usuario;
  }

  async exists(email: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({ email });
    return !!usuario;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
