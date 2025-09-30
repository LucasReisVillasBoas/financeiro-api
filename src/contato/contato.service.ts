import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Contato } from '../entities/contato/contato.entity';
import { ContatoRepository } from './contato.repository';
import { CreateContatoDto } from './dto/create-contato.dto';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { EmpresaRepository } from '../empresa/empresa.repository';
import { UpdateContatoDto } from './dto/update-contato.dto';
@Injectable()
export class ContatoService {
  constructor(
    @InjectRepository(Contato)
    private readonly contatoRepository: ContatoRepository,
    private readonly empresaRepository: EmpresaRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async create(createContatoDto: CreateContatoDto): Promise<Contato> {
    const { clienteId, filialId, ...contatoData } = createContatoDto;

    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    let filial = null;
    if (filialId) {
      filial = await this.empresaRepository.findOne({
        id: filialId,
        cliente_id: clienteId,
      });
      if (!filial) {
        throw new NotFoundException(
          `Filial com ID ${filialId} não encontrada para o cliente ${clienteId}`,
        );
      }
    }

    const contatoExistente = await this.contatoRepository.findOne({
      funcao: contatoData.funcao,
      cliente,
    });

    if (contatoExistente) {
      throw new BadRequestException(
        `Já existe um contato com celular ${contatoData.celular} para este cliente`,
      );
    }

    const entity = this.contatoRepository.create({
      ...contatoData,
      cliente: cliente,
      filial,
    });

    await this.contatoRepository.persistAndFlush(entity);
    return entity;
  }

  async findAll(clienteId: string): Promise<Contato[]> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    return this.contatoRepository.find(
      { cliente: cliente },
      {
        populate: ['filial'],
        orderBy: { nome: 'ASC' },
      },
    );
  }

  async findOne(id: string, clienteId: string): Promise<Contato> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    const contato = await this.contatoRepository.findOne(
      { id, cliente: cliente },
      { populate: ['filial'] },
    );

    if (!contato) {
      throw new NotFoundException(`Contato com ID ${id} não encontrado`);
    }

    return contato;
  }

  async update(
    id: string,
    clienteId: string,
    updateContatoDto: UpdateContatoDto,
  ): Promise<Contato> {
    const contato = await this.findOne(id, clienteId);
    const { clienteId: newClienteId, ...contatoData } = updateContatoDto;

    if (contatoData.filialId) {
      throw new BadRequestException(
        `Não é permitido alterar a filial do contato`,
      );
    }

    Object.assign(contato, contatoData);
    await this.contatoRepository.flush();

    return contato;
  }

  async remove(id: string, clienteId: string): Promise<void> {
    const contato = await this.findOne(id, clienteId);
    await this.contatoRepository.removeAndFlush(contato);
  }
}
