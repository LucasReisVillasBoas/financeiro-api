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

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: PerfilRepository,

    @InjectRepository(UsuarioPerfil)
    private readonly usuarioPerfilRepository: UsuarioPerfilRepository,

    @InjectRepository(Usuario)
    private readonly usuarioService: UsuarioService,
  ) {}

  async create(dto: CreatePerfilDto): Promise<Perfil> {
    const usuario = await this.usuarioService.findOne(dto.clienteId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Criar o perfil
    const perfil = this.perfilRepository.create(dto);
    await this.perfilRepository.flush();

    // Buscar associações de empresas do usuário através de UsuarioEmpresaFilial
    const associacoesUsuario = await usuario.empresasFiliais.loadItems();

    if (associacoesUsuario.length === 0) {
      throw new BadRequestException(
        'Usuário deve estar associado a pelo menos uma empresa antes de criar perfil',
      );
    }

    // Criar UsuarioPerfil para a primeira empresa associada
    const primeiraEmpresa = associacoesUsuario[0].empresa;

    const jaExiste = await this.usuarioPerfilRepository.findOne({
      usuario,
      perfil,
      empresa: primeiraEmpresa,
    });

    if (jaExiste) {
      throw new BadRequestException('Associação já existe');
    }

    const associacao = this.usuarioPerfilRepository.create({
      usuario,
      perfil,
      empresa: primeiraEmpresa,
      ativo: true,
    });

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
