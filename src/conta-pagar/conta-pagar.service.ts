import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContaPagarRepository } from './conta-pagar.repository';
import { CreateContaPagarDto } from './dto/create-conta-pagar.dto';
import { UpdateContaPagarDto } from './dto/update-conta-pagar.dto';
import { ContaPagar } from '../entities/conta-pagar/conta-pagar.entity';

@Injectable()
export class ContaPagarService {
  constructor(
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: ContaPagarRepository,
  ) {}

  async create(dto: CreateContaPagarDto): Promise<ContaPagar> {
    const conta = this.contaPagarRepository.create({
      ...dto,
      vencimento: new Date(dto.vencimento),
      dataPagamento: dto.dataPagamento
        ? new Date(dto.dataPagamento)
        : undefined,
    });
    await this.contaPagarRepository.persistAndFlush(conta);
    return conta;
  }

  async findAll(): Promise<ContaPagar[]> {
    return await this.contaPagarRepository.find({ deletadoEm: null });
  }

  async findByEmpresa(empresaId: string): Promise<ContaPagar[]> {
    return await this.contaPagarRepository.find({
      empresaId,
      deletadoEm: null,
    });
  }

  async findOne(id: string): Promise<ContaPagar> {
    const conta = await this.contaPagarRepository.findOne({
      id,
      deletadoEm: null,
    });

    if (!conta) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    return conta;
  }

  async update(id: string, dto: UpdateContaPagarDto): Promise<ContaPagar> {
    const conta = await this.findOne(id);
    const updateData: any = { ...dto };

    if (dto.vencimento) {
      updateData.vencimento = new Date(dto.vencimento);
    }

    if (dto.dataPagamento) {
      updateData.dataPagamento = new Date(dto.dataPagamento);
    }

    this.contaPagarRepository.assign(conta, updateData);
    await this.contaPagarRepository.flush();
    return conta;
  }

  async marcarComoPaga(id: string): Promise<ContaPagar> {
    const conta = await this.findOne(id);
    conta.status = 'Paga';
    conta.dataPagamento = new Date();
    await this.contaPagarRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    await this.contaPagarRepository.persistAndFlush(conta);
  }
}
