import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PerfilRepository } from './perfil.repository';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Perfil } from '../entities/perfil/perfil.entity';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { UsuarioPerfilRepository } from '../usuario-perfil/usuario-perfil.repository';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { EmpresaService } from '../empresa/empresa.service';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { UsuarioEmpresaFilialRepository } from '../usuario/usuario-empresa-filial.repository';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: PerfilRepository,

    @InjectRepository(UsuarioPerfil)
    private readonly usuarioPerfilRepository: UsuarioPerfilRepository,

    @InjectRepository(Usuario)
    private readonly usuarioService: UsuarioService,

    @InjectRepository(UsuarioEmpresaFilial)
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,

    private readonly empresaService: EmpresaService,
  ) {}

  async create(dto: CreatePerfilDto): Promise<Perfil> {
    const usuario = await this.usuarioService.findOne(dto.clienteId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    let empresa = null;

    // Se empresaId foi fornecido, usa diretamente
    if (dto.empresaId) {
      empresa = await this.empresaService.findOne(dto.empresaId);
      if (!empresa) {
        throw new NotFoundException(
          `Empresa com ID ${dto.empresaId} não encontrada`,
        );
      }
    } else {
      // Fallback: busca empresas do cliente
      const empresaList = await this.empresaService.findAllByCliente(
        dto.clienteId,
      );
      empresa = empresaList.at(0);

      if (!empresa) {
        throw new BadRequestException(
          'Nenhuma empresa encontrada. Forneça o empresaId ou cadastre uma empresa antes de criar o perfil.',
        );
      }
    }

    const perfil = this.perfilRepository.create({
      clienteId: dto.clienteId,
      nome: dto.nome,
      permissoes: dto.permissoes,
    });

    const jaExiste = await this.usuarioPerfilRepository.findOne({
      usuario,
      perfil,
      empresa,
    });

    if (jaExiste) {
      throw new BadRequestException('Associação já existe');
    }

    const associacao = this.usuarioPerfilRepository.create({
      usuario,
      perfil,
      empresa,
      ativo: true,
    });

    this.perfilRepository.persist(perfil);
    await this.usuarioPerfilRepository.persistAndFlush(associacao);

    return perfil;
  }

  async findAll(clienteId: string): Promise<Perfil[]> {
    return this.perfilRepository.find({ clienteId, ativo: true });
  }

  async findOne(id: string, clienteId: string): Promise<Perfil> {
    const perfil = await this.perfilRepository.findOne({
      id,
      clienteId,
      ativo: true,
    });
    if (!perfil) throw new NotFoundException('Perfil não encontrado');
    return perfil;
  }

  async findByCliente(clienteId: string): Promise<Perfil[]> {
    const perfis = await this.perfilRepository.find({
      clienteId,
      ativo: true,
    });
    if (!perfis) throw new NotFoundException('Perfil não encontrado');
    return perfis;
  }

  async update(
    id: string,
    dto: UpdatePerfilDto,
    clienteId: string,
  ): Promise<Perfil> {
    const perfil = await this.findOne(id, clienteId);

    // Não permite editar perfil Master Admin
    if (perfil.masterAdmin) {
      throw new BadRequestException(
        'Não é possível editar o perfil do Administrador Master. Este perfil possui acesso total e não pode ser modificado.',
      );
    }

    this.perfilRepository.assign(perfil, dto);
    await this.perfilRepository.flush();
    return perfil;
  }

  async softDelete(id: string, clienteId: string): Promise<void> {
    const perfil = await this.findOne(id, clienteId);

    // Não permite excluir perfil Master Admin
    if (perfil.masterAdmin) {
      throw new BadRequestException(
        'Não é possível excluir o perfil do Administrador Master. Este perfil possui acesso total e não pode ser removido.',
      );
    }

    perfil.ativo = false;
    perfil.deletadoEm = new Date();
    await this.perfilRepository.flush();
  }

  /**
   * Verifica se o usuário possui perfil de Administrador
   */
  async isAdmin(usuarioId: string): Promise<boolean> {
    const usuarioPerfis = await this.usuarioPerfilRepository.find(
      { usuario: { id: usuarioId }, ativo: true },
      { populate: ['perfil'] },
    );

    return usuarioPerfis.some(
      (up) => up.perfil?.nome?.toLowerCase() === 'administrador',
    );
  }

  /**
   * Busca todos os perfis vinculados às empresas que o usuário tem acesso
   * Usado quando o usuário é administrador
   */
  async findAllByUsuarioEmpresas(usuarioId: string): Promise<Perfil[]> {
    // Busca todas as empresas que o usuário tem acesso
    const usuarioEmpresas = await this.usuarioEmpresaFilialRepository.find(
      { usuario: { id: usuarioId } },
      { populate: ['empresa'] },
    );

    if (usuarioEmpresas.length === 0) {
      return [];
    }

    const empresaIds = usuarioEmpresas.map((ue) => ue.empresa.id);

    // Busca todos os UsuarioPerfil vinculados às empresas do usuário
    const usuarioPerfis = await this.usuarioPerfilRepository.find(
      {
        empresa: { id: { $in: empresaIds } },
        ativo: true,
      },
      { populate: ['perfil'] },
    );

    // Extrai os perfis únicos (sem duplicatas)
    const perfisMap = new Map<string, Perfil>();
    for (const up of usuarioPerfis) {
      if (up.perfil && up.perfil.ativo && !perfisMap.has(up.perfil.id)) {
        perfisMap.set(up.perfil.id, up.perfil);
      }
    }

    return Array.from(perfisMap.values());
  }

  /**
   * Busca um perfil específico se estiver vinculado às empresas do usuário admin
   */
  async findOneByUsuarioEmpresas(
    perfilId: string,
    usuarioId: string,
  ): Promise<Perfil> {
    // Busca todas as empresas que o usuário tem acesso
    const usuarioEmpresas = await this.usuarioEmpresaFilialRepository.find(
      { usuario: { id: usuarioId } },
      { populate: ['empresa'] },
    );

    if (usuarioEmpresas.length === 0) {
      throw new NotFoundException('Perfil não encontrado');
    }

    const empresaIds = usuarioEmpresas.map((ue) => ue.empresa.id);

    // Verifica se o perfil está vinculado a alguma das empresas do usuário
    const usuarioPerfil = await this.usuarioPerfilRepository.findOne(
      {
        perfil: { id: perfilId },
        empresa: { id: { $in: empresaIds } },
        ativo: true,
      },
      { populate: ['perfil'] },
    );

    if (!usuarioPerfil || !usuarioPerfil.perfil || !usuarioPerfil.perfil.ativo) {
      throw new NotFoundException('Perfil não encontrado');
    }

    return usuarioPerfil.perfil;
  }

  /**
   * Atualiza um perfil como administrador (verifica se está vinculado às empresas do admin)
   */
  async updateAsAdmin(
    id: string,
    dto: UpdatePerfilDto,
    usuarioId: string,
  ): Promise<Perfil> {
    const perfil = await this.findOneByUsuarioEmpresas(id, usuarioId);

    // Não permite editar perfil Master Admin
    if (perfil.masterAdmin) {
      throw new BadRequestException(
        'Não é possível editar o perfil do Administrador Master. Este perfil possui acesso total e não pode ser modificado.',
      );
    }

    this.perfilRepository.assign(perfil, dto);
    await this.perfilRepository.flush();
    return perfil;
  }

  /**
   * Soft delete de um perfil como administrador (verifica se está vinculado às empresas do admin)
   */
  async softDeleteAsAdmin(id: string, usuarioId: string): Promise<void> {
    const perfil = await this.findOneByUsuarioEmpresas(id, usuarioId);

    // Não permite excluir perfil Master Admin
    if (perfil.masterAdmin) {
      throw new BadRequestException(
        'Não é possível excluir o perfil do Administrador Master. Este perfil possui acesso total e não pode ser removido.',
      );
    }

    perfil.ativo = false;
    perfil.deletadoEm = new Date();
    await this.perfilRepository.flush();
  }

  /**
   * Verifica se um perfil é Master Admin
   */
  async isMasterAdmin(perfilId: string): Promise<boolean> {
    const perfil = await this.perfilRepository.findOne({ id: perfilId });
    return perfil?.masterAdmin || false;
  }
}
