import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MovimentacaoBancariaRepository } from './movimentacao-bancaria.repository';
import { CreateMovimentacaoBancariaDto } from './dto/create-movimentacao-bancaria.dto';
import { UpdateMovimentacaoBancariaDto } from './dto/update-movimentacao-bancaria.dto';
import { MovimentacaoBancaria } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';

@Injectable()
export class MovimentacaoBancariaService {
  constructor(
    @InjectRepository(MovimentacaoBancaria)
    private readonly movimentacaoRepository: MovimentacaoBancariaRepository,
  ) {}

  async create(
    dto: CreateMovimentacaoBancariaDto,
  ): Promise<MovimentacaoBancaria> {
    const movimentacao = this.movimentacaoRepository.create({
      ...dto,
      data: new Date(dto.data),
    });
    await this.movimentacaoRepository.persistAndFlush(movimentacao);
    return movimentacao;
  }

  async findAll(): Promise<MovimentacaoBancaria[]> {
    return await this.movimentacaoRepository.find(
      { deletadoEm: null },
      { populate: ['contaBancaria'] },
    );
  }

  async findByPeriodo(
    dataInicio: string,
    dataFim: string,
  ): Promise<MovimentacaoBancaria[]> {
    return await this.movimentacaoRepository.find(
      {
        data: {
          $gte: new Date(dataInicio),
          $lte: new Date(dataFim),
        },
        deletadoEm: null,
      },
      { populate: ['contaBancaria'] },
    );
  }

  async findByConta(contaId: string): Promise<MovimentacaoBancaria[]> {
    return await this.movimentacaoRepository.find(
      {
        contaBancaria: contaId,
        deletadoEm: null,
      },
      { populate: ['contaBancaria'] },
    );
  }

  async findOne(id: string): Promise<MovimentacaoBancaria> {
    const movimentacao = await this.movimentacaoRepository.findOne(
      {
        id,
        deletadoEm: null,
      },
      { populate: ['contaBancaria'] },
    );

    if (!movimentacao) {
      throw new NotFoundException('Movimentação bancária não encontrada');
    }

    return movimentacao;
  }

  async update(
    id: string,
    dto: UpdateMovimentacaoBancariaDto,
  ): Promise<MovimentacaoBancaria> {
    const movimentacao = await this.findOne(id);
    const updateData = { ...dto };

    if (dto.data) {
      updateData.data = new Date(dto.data) as any;
    }

    this.movimentacaoRepository.assign(movimentacao, updateData);
    await this.movimentacaoRepository.flush();
    return movimentacao;
  }

  async softDelete(id: string): Promise<void> {
    const movimentacao = await this.findOne(id);
    movimentacao.deletadoEm = new Date();
    await this.movimentacaoRepository.persistAndFlush(movimentacao);
  }
}
