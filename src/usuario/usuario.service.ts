import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import * as bcrypt from 'bcryptjs';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { UsuarioEmpresaFilialRepository } from './usuario-empresa-filial.repository';
import { AssociarEmpresaFilialRequestDto } from './dto/associar-empresa-filial-request.dto';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly empresaService: EmpresaService,
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,
  ) {}

  async create(dto: UsuarioCreateRequestDto): Promise<Usuario> {
    if (await this.exists(dto.email)) {
      throw new BadRequestException('Email já existe');
    }

    const usuario = this.usuarioRepository.create(dto);
    usuario.senha = await this.hashPassword(dto.senha);
    await this.usuarioRepository.persistAndFlush(usuario);
    return usuario;
  }

  async getByEmail(email: string, empresaId?: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ email });
    if (!usuario) throw new NotFoundException('Usuario not found');
    if (
      empresaId &&
      !usuario.empresasFiliais
        .getItems()
        .some((uef) => uef.empresa.id === empresaId)
    ) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return usuario;
  }

  async getById(id: string, empresaId?: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    // if (
    //   empresaId &&
    //   !usuario.empresasFiliais
    //     .getItems()
    //     .some((uef) => uef.empresa.id === empresaId)
    // ) {
    //   throw new NotFoundException('Usuário não encontrado');
    // }
    return usuario;
  }

  async exists(email: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({ email });
    return !!usuario;
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  /**
   * Associa usuário a uma empresa ou filial (ambas são Empresa)
   */
  async associarEmpresaOuFilial(
    usuarioId: string,
    dto: AssociarEmpresaFilialRequestDto,
  ): Promise<UsuarioEmpresaFilial> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const empresa = await this.empresaService.findOne(dto.empresaId);
    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    const isFilial = !!empresa.sede;

    // Evita duplicidade
    const jaExiste = await this.usuarioEmpresaFilialRepository.findOne({
      usuario,
      empresa,
      filial: isFilial,
    });

    if (jaExiste) {
      throw new BadRequestException('Associação já existe');
    }

    const associacao = this.usuarioEmpresaFilialRepository.create({
      usuario,
      empresa,
      filial: isFilial,
    });

    await this.usuarioEmpresaFilialRepository.persistAndFlush(associacao);
    return associacao;
  }

  /**
   * Lista todas as empresas/filiais vinculadas ao usuário
   */
  async listarAssociacoes(usuarioId: string): Promise<UsuarioEmpresaFilial[]> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    return this.usuarioEmpresaFilialRepository.find(
      { usuario },
      { populate: ['empresa', 'filial'] },
    );
  }

  /**
   * Remove vínculo do usuário com empresa/filial
   */
  async removerAssociacao(usuarioId: string, assocId: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const associacao = await this.usuarioEmpresaFilialRepository.findOne({
      id: assocId,
      usuario,
    });

    if (!associacao) {
      throw new NotFoundException('Associação não encontrada');
    }

    await this.usuarioEmpresaFilialRepository.removeAndFlush(associacao);
  }
}
