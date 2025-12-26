import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { UpdateUsuarioPerfilDto } from './dto/update-usuario-perfil.dto';
import { UsuarioPerfilRepository } from './usuario-perfil.repository';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class UsuarioPerfilService {
  constructor(
    @InjectRepository(UsuarioPerfil)
    private readonly usuarioPerfilRepository: UsuarioPerfilRepository,
  ) {}

  async findByUsuario(usuarioId: string): Promise<UsuarioPerfil[]> {
    return this.usuarioPerfilRepository.find(
      { usuario: { id: usuarioId }, ativo: true },
      { populate: ['perfil', 'empresa'] },
    );
  }

  async update(
    id: string,
    dto: UpdateUsuarioPerfilDto,
  ): Promise<UsuarioPerfil> {
    const usuarioPerfil = await this.usuarioPerfilRepository.findOne({ id });
    if (!usuarioPerfil) {
      throw new NotFoundException('Associação usuário-perfil não encontrada');
    }
    this.usuarioPerfilRepository.assign(usuarioPerfil, dto);
    await this.usuarioPerfilRepository.flush();
    return usuarioPerfil;
  }

  async softDelete(id: string): Promise<void> {
    const usuarioPerfil = await this.usuarioPerfilRepository.findOne({ id });
    if (!usuarioPerfil) {
      throw new NotFoundException('Associação usuário-perfil não encontrada');
    }
    usuarioPerfil.ativo = false;
    usuarioPerfil.deletadoEm = new Date();
    await this.usuarioPerfilRepository.flush();
  }
}
