import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MovimentacoesBancariasRepository } from './movimentacao-bancaria.repository';
import { CreateMovimentacoesBancariasDto } from './dto/create-movimentacao-bancaria.dto';
import { UpdateMovimentacoesBancariasDto } from './dto/update-movimentacao-bancaria.dto';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';

@Injectable()
export class MovimentacoesBancariasService {
  constructor(
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly contasBancariasRepository: ContasBancariasRepository,
  ) {}

  async create(
    dto: CreateMovimentacoesBancariasDto,
  ): Promise<MovimentacoesBancarias> {
    const contaBancaria = await this.contasBancariasRepository.findOne({
      id: dto.contaBancaria,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    const { contaBancaria: contaBancariaId, ...dadosMovimentacao } = dto;
    const movimentacao = this.movimentacaoRepository.create({
      ...dadosMovimentacao,
      data: new Date(dto.data),
      contaBancaria,
    });

    const valorMovimentacao = dto.tipo === 'Entrada' ? dto.valor : -dto.valor;
    contaBancaria.saldo_atual = contaBancaria.saldo_atual + valorMovimentacao;

    await this.movimentacaoRepository.persistAndFlush([movimentacao, contaBancaria]);

    return movimentacao;
  }

  async findAll(): Promise<MovimentacoesBancarias[]> {
    return await this.movimentacaoRepository.find(
      { deletadoEm: null },
      { populate: ['contaBancaria'] },
    );
  }

  async findByPeriodo(
    dataInicio: string,
    dataFim: string,
  ): Promise<MovimentacoesBancarias[]> {
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

  async findByConta(contaId: string): Promise<MovimentacoesBancarias[]> {
    return await this.movimentacaoRepository.find(
      {
        contaBancaria: contaId,
        deletadoEm: null,
      },
      { populate: ['contaBancaria'] },
    );
  }

  async findOne(id: string): Promise<MovimentacoesBancarias> {
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
    dto: UpdateMovimentacoesBancariasDto,
  ): Promise<MovimentacoesBancarias> {
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
