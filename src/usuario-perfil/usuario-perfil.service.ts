import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { UpdateUsuarioPerfilDto } from './dto/update-usuario-perfil.dto';
import { UsuarioPerfilRepository } from './usuario-perfil.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Empresa } from '../entities/empresa/empresa.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { UsuarioEmpresaFilialRepository } from '../usuario/usuario-empresa-filial.repository';

@Injectable()
export class UsuarioPerfilService {
  constructor(
    @InjectRepository(UsuarioPerfil)
    private readonly usuarioPerfilRepository: UsuarioPerfilRepository,
    @InjectRepository(UsuarioEmpresaFilial)
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,
  ) {}

  async findByUsuario(usuarioId: string): Promise<UsuarioPerfil[]> {
    return this.usuarioPerfilRepository.find(
      { usuario: { id: usuarioId }, ativo: true },
      { populate: ['perfil', 'empresa'] },
    );
  }

  async findByCliente(clienteId: string): Promise<UsuarioPerfil[]> {
    // Busca todas as empresas que o usuário tem acesso via usuario_empresa_filial
    const usuarioEmpresas = await this.usuarioEmpresaFilialRepository.find(
      { usuario: { id: clienteId } },
      { populate: ['empresa', 'empresa.sede'] },
    );

    if (usuarioEmpresas.length === 0) {
      return [];
    }

    const empresaIds = usuarioEmpresas.map((ue) => ue.empresa.id);

    // Busca todos os UsuarioPerfil vinculados às empresas do usuário
    return this.usuarioPerfilRepository.find(
      {
        empresa: { id: { $in: empresaIds } },
        ativo: true,
      },
      {
        populate: ['usuario', 'empresa', 'empresa.sede', 'perfil'],
        orderBy: { usuario: { nome: 'ASC' } },
      },
    );
  }

  async findByClienteComEmpresas(clienteId: string): Promise<{
    usuariosPerfis: UsuarioPerfil[];
    todasEmpresas: Empresa[];
  }> {
    console.log('=== findByClienteComEmpresas ===');
    console.log('clienteId:', clienteId);

    // Busca todas as empresas que o usuário tem acesso via usuario_empresa_filial
    const usuarioEmpresas = await this.usuarioEmpresaFilialRepository.find(
      { usuario: { id: clienteId } },
      { populate: ['empresa', 'empresa.sede'] },
    );

    console.log('usuarioEmpresas encontrados:', usuarioEmpresas.length);
    console.log(
      'empresas:',
      usuarioEmpresas.map((ue) => ({
        id: ue.empresa.id,
        nome: ue.empresa.nome_fantasia,
        sede: ue.empresa.sede?.id,
      })),
    );

    if (usuarioEmpresas.length === 0) {
      return { usuariosPerfis: [], todasEmpresas: [] };
    }

    const empresas = usuarioEmpresas.map((ue) => ue.empresa);
    const empresaIds = empresas.map((e) => e.id);

    // Busca todos os UsuarioPerfil vinculados às empresas do usuário
    const usuariosPerfis = await this.usuarioPerfilRepository.find(
      {
        empresa: { id: { $in: empresaIds } },
        ativo: true,
      },
      {
        populate: ['usuario', 'empresa', 'empresa.sede', 'perfil'],
        orderBy: { usuario: { nome: 'ASC' } },
      },
    );

    console.log('usuariosPerfis encontrados:', usuariosPerfis.length);

    return { usuariosPerfis, todasEmpresas: empresas };
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
