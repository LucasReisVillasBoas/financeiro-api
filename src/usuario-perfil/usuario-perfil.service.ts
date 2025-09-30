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

  async findAll(): Promise<UsuarioPerfil[]> {
    return this.usuarioPerfilRepository.findAll();
  }

  async findByCliente(clienteId: string): Promise<UsuarioPerfil[]> {
    return this.usuarioPerfilRepository.find(
      { usuario: { id: clienteId } },
      { populate: ['perfil'] },
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
