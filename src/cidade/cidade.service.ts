import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCidadeDto } from './dto/create-cidade.dto';
import { UpdateCidadeDto } from './dto/update-cidade.dto';
import { Cidade } from '../entities/cidade/cidade.entity';
import { CidadeRepository } from './cidade.repository';
import { EmpresaRepository } from '../empresa/empresa.repository';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { isKnownIBGECode } from '../validators/ibge.validator';

@Injectable()
export class CidadeService {
  constructor(
    @InjectRepository(Cidade)
    private readonly cidadeRepository: CidadeRepository,
    private readonly empresaRepository: EmpresaRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async create(createCidadeDto: CreateCidadeDto): Promise<Cidade> {
    const { clienteId, filialId, ...cidadeData } = createCidadeDto;

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

    if (isKnownIBGECode(cidadeData.codigoIbge, cidadeData.uf)) {
    } else if (isKnownIBGECode(cidadeData.codigoIbge)) {
      throw new BadRequestException(
        `O código IBGE ${cidadeData.codigoIbge} não pertence ao estado ${cidadeData.uf}`,
      );
    }

    const cidadeExistente = await this.cidadeRepository.findOne({
      codigoIbge: cidadeData.codigoIbge,
      cliente,
    });

    if (cidadeExistente) {
      throw new BadRequestException(
        `Já existe uma cidade com código IBGE ${cidadeData.codigoIbge} para este cliente`,
      );
    }

    const entity = this.cidadeRepository.create({
      ...cidadeData,
      cliente: cliente,
      filial,
    });

    await this.cidadeRepository.persistAndFlush(entity);
    return entity;
  }

  async findAll(clienteId: string): Promise<Cidade[]> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    return this.cidadeRepository.find(
      { cliente: cliente },
      {
        populate: ['filial'],
        orderBy: { nome: 'ASC' },
      },
    );
  }

  async findOne(id: string, clienteId: string): Promise<Cidade> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    const cidade = await this.cidadeRepository.findOne(
      { id, cliente: cliente },
      { populate: ['filial'] },
    );

    if (!cidade) {
      throw new NotFoundException(`Cidade com ID ${id} não encontrada`);
    }

    return cidade;
  }

  async update(
    id: string,
    clienteId: string,
    updateCidadeDto: UpdateCidadeDto,
    admin?: string,
  ): Promise<Cidade> {
    const cidade = await this.findOne(id, clienteId);
    const {
      clienteId: newClienteId,
      filialId,
      ...cidadeData
    } = updateCidadeDto;

    if (cidadeData.codigoIbge || cidadeData.codigoBacen || newClienteId) {
      throw new BadRequestException(
        `Não é permitido alterar o código IBGE, código BACEN ou o cliente da cidade`,
      );
    }

    if (filialId !== undefined) {
      if (filialId === null) {
        cidade.filial = undefined;
      } else {
        const filial = await this.empresaRepository.findOne({
          id: filialId,
          cliente_id: admin ?? clienteId,
        });
        if (!filial) {
          throw new NotFoundException(
            `Filial com ID ${filialId} não encontrada para o cliente ${clienteId}`,
          );
        }
        cidade.filial = filial;
      }
    }

    Object.assign(cidade, cidadeData);
    await this.cidadeRepository.flush();

    return cidade;
  }

  async remove(id: string, clienteId: string): Promise<void> {
    const cidade = await this.findOne(id, clienteId);
    await this.cidadeRepository.removeAndFlush(cidade);
  }

  async findByUf(uf: string, clienteId: string): Promise<Cidade[]> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    return this.cidadeRepository.find(
      { uf, cliente: cliente },
      {
        populate: ['filial'],
        orderBy: { nome: 'ASC' },
      },
    );
  }

  async findByCodigoIbge(
    codigoIbge: string,
    clienteId: string,
  ): Promise<Cidade | null> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    return this.cidadeRepository.findOne(
      { codigoIbge, cliente: cliente },
      { populate: ['filial'] },
    );
  }

  async findByCliente(clienteId: string): Promise<Cidade | null> {
    const cliente = await this.usuarioRepository.findOne({ id: clienteId });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    return this.cidadeRepository.findOne(
      { cliente: cliente },
      { populate: ['filial'] },
    );
  }
}
