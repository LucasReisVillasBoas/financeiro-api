import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContaBancariaRepository } from './conta-bancaria.repository';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';
import { ContaBancaria } from '../entities/conta-bancaria/conta-bancaria.entity';

@Injectable()
export class ContaBancariaService {
  constructor(
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: ContaBancariaRepository,
  ) {}

  async create(dto: CreateContaBancariaDto): Promise<ContaBancaria> {
    const contasExistentes = await this.findByEmpresa(dto.empresaId);
    if (contasExistentes.length > 0) {
      const existe = contasExistentes.find((c) => c.conta === dto.conta);
      if (existe) {
        throw new BadRequestException(
          'Conta bancária já existe para essa empresa',
        );
      }
    }
    const conta = this.contaBancariaRepository.create(dto);
    await this.contaBancariaRepository.persistAndFlush(conta);
    return conta;
  }

  async findAll(): Promise<ContaBancaria[]> {
    return await this.contaBancariaRepository.find({
      deletadoEm: null,
    });
  }

  async findByEmpresa(empresaId: string): Promise<ContaBancaria[]> {
    return await this.contaBancariaRepository.find({
      empresa: empresaId,
      deletadoEm: null,
    });
  }

  async findOne(id: string): Promise<ContaBancaria> {
    const conta = await this.contaBancariaRepository.findOne({
      id,
      deletadoEm: null,
    });

    if (!conta) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    return conta;
  }

  async update(
    id: string,
    dto: UpdateContaBancariaDto,
  ): Promise<ContaBancaria> {
    const conta = await this.findOne(id);
    this.contaBancariaRepository.assign(conta, dto);
    await this.contaBancariaRepository.flush();
    return conta;
  }

  async toggleStatus(id: string): Promise<ContaBancaria> {
    const conta = await this.findOne(id);
    conta.ativo = !conta.ativo;
    await this.contaBancariaRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    conta.ativo = false;
    await this.contaBancariaRepository.persistAndFlush(conta);
  }
}
