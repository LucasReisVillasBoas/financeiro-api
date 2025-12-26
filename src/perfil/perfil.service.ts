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

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: PerfilRepository,

    @InjectRepository(UsuarioPerfil)
    private readonly usuarioPerfilRepository: UsuarioPerfilRepository,

    @InjectRepository(Usuario)
    private readonly usuarioService: UsuarioService,

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
    this.perfilRepository.assign(perfil, dto);
    await this.perfilRepository.flush();
    return perfil;
  }

  async softDelete(id: string, clienteId: string): Promise<void> {
    const filial = await this.findOne(id, clienteId);
    filial.ativo = false;
    filial.deletadoEm = new Date();
    await this.perfilRepository.flush();
  }
}
