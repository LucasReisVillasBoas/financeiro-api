import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ContasReceberRepository } from './conta-receber.repository';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { PlanoContas } from '../entities/plano-contas/plano-contas.entity';

@Injectable()
export class ContasReceberService {
  constructor(
    @InjectRepository(ContasReceber)
    private readonly contasReceberRepository: ContasReceberRepository,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateContaReceberDto): Promise<ContasReceber> {
    const contaData: any = {
      descricao: dto.descricao,
      valor: dto.valor,
      vencimento: new Date(dto.vencimento),
      status: dto.status || 'Pendente',
      cliente: dto.cliente,
      dataRecebimento: dto.dataRecebimento
        ? new Date(dto.dataRecebimento)
        : undefined,
      empresaId: dto.empresaId,
    };

    if (dto.planoContasId) {
      contaData.planoContas = this.em.getReference(PlanoContas, dto.planoContasId);
    }

    const conta = this.contasReceberRepository.create(contaData);
    await this.contasReceberRepository.persistAndFlush(conta);
    return conta;
  }

  async findAll(): Promise<ContasReceber[]> {
    return await this.contasReceberRepository.find({ deletadoEm: null });
  }

  async findByEmpresa(empresaId: string): Promise<ContasReceber[]> {
    return await this.contasReceberRepository.find({
      empresaId,
      deletadoEm: null,
    });
  }

  async findOne(id: string): Promise<ContasReceber> {
    const conta = await this.contasReceberRepository.findOne({
      id,
      deletadoEm: null,
    });

    if (!conta) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    return conta;
  }

  async update(id: string, dto: UpdateContaReceberDto): Promise<ContasReceber> {
    const conta = await this.findOne(id);
    const updateData: any = { ...dto };

    if (dto.vencimento) {
      updateData.vencimento = new Date(dto.vencimento);
    }

    if (dto.dataRecebimento) {
      updateData.dataRecebimento = new Date(dto.dataRecebimento);
    }

    this.contasReceberRepository.assign(conta, updateData);
    await this.contasReceberRepository.flush();
    return conta;
  }

  async marcarComoRecebida(id: string): Promise<ContasReceber> {
    const conta = await this.findOne(id);
    conta.status = 'Recebida';
    conta.dataRecebimento = new Date();
    await this.contasReceberRepository.persistAndFlush(conta);
    return conta;
  }

  async softDelete(id: string): Promise<void> {
    const conta = await this.findOne(id);
    conta.deletadoEm = new Date();
    await this.contasReceberRepository.persistAndFlush(conta);
  }
}
