import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContaReceberRepository } from './conta-receber.repository';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';
import { ContaReceber } from '../entities/conta-receber/conta-receber.entity';

@Injectable()
export class ContaReceberService {
  constructor(
    @InjectRepository(ContaReceber)
    private readonly contaReceberRepository: ContaReceberRepository,
  ) {}

  async create(dto: CreateContaReceberDto): Promise<ContaReceber> {
    const conta = this.contaReceberRepository.create({
      ...dto,
      vencimento: new Date(dto.vencimento),
      dataRecebimento: dto.dataRecebimento
        ? new Date(dto.dataRecebimento)
        : undefined,
    });
    await this.contaReceberRepository.persistAndFlush(conta);
    return conta;
  }

  async findAll(): Promise<ContaReceber[]> {
    return await this.contaReceberRepository.find({ deletadoEm: null });
  }

  async findByEmpresa(empresaId: string): Promise<ContaReceber[]> {
    return await this.contaReceberRepository.find({
      empresaId,
      deletadoEm: null,
    });
  }

  async findOne(id: string): Promise<ContaReceber> {
    const conta = await this.contaReceberRepository.findOne({
      id,
      deletadoEm: null,
    });

    if (!conta) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    return conta;
  }

  async update(id: string, dto: UpdateContaReceberDto): Promise<ContaReceber> {
    const conta = await this.findOne(id);
    const updateData: any = { ...dto };

    if (dto.vencimento) {
      updateData.vencimento = new Date(dto.vencimento);
    }

    if (dto.dataRecebimento) {
      updateData.dataRecebimento = new Date(dto.dataRecebimento);
    }

    this.contaReceberRepository.assign(conta, updateData);
    await this.contaReceberRepository.flush();
    return conta;
  }

  async marcarComoRecebida(id: string): Promise<ContaReceber> {
    const conta = await this.findOne(id);
    conta.status = 'Recebida';
    conta.dataRecebimento = new Date();
    await this.contaReceberRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    await this.contaReceberRepository.persistAndFlush(conta);
  }
}
