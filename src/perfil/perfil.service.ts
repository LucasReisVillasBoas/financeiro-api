import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PerfilRepository } from './perfil.repository';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Perfil } from '../entities/perfil/perfil.entity';

@Injectable()
export class PerfilService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: PerfilRepository,
  ) {}

  async create(dto: CreatePerfilDto, user: any): Promise<Perfil> {
    const perfil = this.perfilRepository.create(dto);
    await this.perfilRepository.flush();
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
    user: any,
    clienteId: string,
  ): Promise<Perfil> {
    const perfil = await this.findOne(id, clienteId);
    this.perfilRepository.assign(perfil, dto);
    await this.perfilRepository.flush();
    return perfil;
  }

  async softDelete(id: string, clienteId: string): Promise<void> {
    // TODO: Adicionar validação de admin
    const filial = await this.findOne(id, clienteId);
    filial.ativo = false;
    filial.deletadoEm = new Date();
    await this.perfilRepository.flush();
  }
}
