import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BaixaPagamentoRepository } from './baixa-pagamento.repository';
import { CreateBaixaPagamentoDto } from './dto/create-baixa-pagamento.dto';
import { BaixaPagamento } from '../entities/baixa-pagamento/baixa-pagamento.entity';
import {
  ContasPagar,
  StatusContaPagar,
} from '../entities/conta-pagar/conta-pagar.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import {
  MovimentacoesBancarias,
  TipoReferencia,
} from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasPagarRepository } from '../conta-pagar/conta-pagar.repository';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import { MovimentacoesBancariasRepository } from '../movimentacao-bancaria/movimentacao-bancaria.repository';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';

@Injectable()
export class BaixaPagamentoService {
  constructor(
    @InjectRepository(BaixaPagamento)
    private readonly baixaPagamentoRepository: BaixaPagamentoRepository,
    @InjectRepository(ContasPagar)
    private readonly contaPagarRepository: ContasPagarRepository,
    @InjectRepository(ContasBancarias)
    private readonly contaBancariaRepository: ContasBancariasRepository,
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateBaixaPagamentoDto,
    userId: string,
    userEmail: string,
  ): Promise<BaixaPagamento> {
    const contaPagar = await this.contaPagarRepository.findOne(
      { id: dto.contaPagarId, deletadoEm: null },
      { populate: ['empresa', 'planoContas', 'pessoa'] },
    );

    if (!contaPagar) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    if (contaPagar.canceladoEm) {
      throw new BadRequestException(
        'Não é possível registrar baixa em conta cancelada',
      );
    }

    if (contaPagar.saldo === 0) {
      throw new BadRequestException('Conta já está totalmente paga');
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: dto.contaBancariaId,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    const acrescimos = dto.acrescimos || 0;
    const descontos = dto.descontos || 0;
    const totalBaixa = dto.valor + acrescimos - descontos;

    if (totalBaixa > contaPagar.saldo) {
      throw new BadRequestException(
        `Total da baixa (${totalBaixa}) não pode ser maior que o saldo devedor (${contaPagar.saldo})`,
      );
    }

    if (contaBancaria.saldo_atual < totalBaixa) {
      throw new BadRequestException(
        `Saldo insuficiente na conta bancária. Saldo: ${contaBancaria.saldo_atual}, Necessário: ${totalBaixa}`,
      );
    }

    const saldoAnterior = contaPagar.saldo;

    contaPagar.saldo -= totalBaixa;
    const saldoPosterior = contaPagar.saldo;

    if (contaPagar.saldo === 0) {
      contaPagar.data_liquidacao = new Date(dto.data);
      contaPagar.status = StatusContaPagar.PAGA;
    } else {
      contaPagar.status = StatusContaPagar.PARCIALMENTE_PAGA;
    }

    const movimentacao = this.movimentacaoRepository.create({
      data: new Date(dto.data),
      descricao:
        dto.observacao ||
        `Baixa de pagamento ${contaPagar.documento} - Parcela ${contaPagar.parcela}`,
      conta: contaBancaria.banco,
      categoria: 'Pagamento Fornecedor',
      valor: totalBaixa,
      tipo: 'Saída',
      contaBancaria,
      empresaId: contaPagar.empresa.id,
      planoContas: contaPagar.planoContas,
      referencia: TipoReferencia.PAGAR,
      observacao: dto.observacao,
    });

    contaBancaria.saldo_atual -= totalBaixa;

    const baixa = this.baixaPagamentoRepository.create({
      contaPagar,
      contaBancaria,
      data: new Date(dto.data),
      valor: dto.valor,
      acrescimos,
      descontos,
      total: totalBaixa,
      observacao: dto.observacao,
      saldo_anterior: saldoAnterior,
      saldo_posterior: saldoPosterior,
      movimentacaoBancariaId: movimentacao.id,
      criadoPorId: userId,
    });

    await this.baixaPagamentoRepository.persistAndFlush(baixa);
    await this.contaBancariaRepository.persistAndFlush(contaBancaria);
    await this.contaPagarRepository.persistAndFlush(contaPagar);
    await this.movimentacaoRepository.persistAndFlush(movimentacao);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_PAGAR_UPDATED,
      severity: AuditSeverity.INFO,
      resource: 'baixas_pagamento',
      action: 'CRIAR_BAIXA',
      success: true,
      userId,
      userEmail,
      empresaId: contaPagar.empresa.id,
      details: {
        message: `Baixa ${baixa.tipo} registrada para ${contaPagar.documento}`,
        baixaId: baixa.id,
        contaPagarId: contaPagar.id,
        valor: dto.valor,
        acrescimos,
        descontos,
        total: totalBaixa,
        saldoAnterior,
        saldoPosterior,
        tipo: baixa.tipo,
      },
    });

    return baixa;
  }

  async findAll(): Promise<BaixaPagamento[]> {
    return await this.baixaPagamentoRepository.find(
      { deletadoEm: null },
      { populate: ['contaPagar', 'contaBancaria'] },
    );
  }

  async findByContaPagar(contaPagarId: string): Promise<BaixaPagamento[]> {
    return await this.baixaPagamentoRepository.find(
      { contaPagar: contaPagarId, deletadoEm: null },
      { populate: ['contaPagar', 'contaBancaria'], orderBy: { data: 'DESC' } },
    );
  }

  async findOne(id: string): Promise<BaixaPagamento> {
    const baixa = await this.baixaPagamentoRepository.findOne(
      { id, deletadoEm: null },
      { populate: ['contaPagar', 'contaBancaria'] },
    );

    if (!baixa) {
      throw new NotFoundException('Baixa de pagamento não encontrada');
    }

    return baixa;
  }

  async estornar(
    id: string,
    justificativa: string,
    userId: string,
    userEmail: string,
  ): Promise<BaixaPagamento> {
    const baixa = await this.findOne(id);

    const contaPagar = await this.contaPagarRepository.findOne({
      id: baixa.contaPagar.id,
    });

    if (!contaPagar) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: baixa.contaBancaria.id,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    contaPagar.saldo += baixa.total;
    contaPagar.status =
      contaPagar.saldo === contaPagar.valor_total
        ? StatusContaPagar.PENDENTE
        : StatusContaPagar.PARCIALMENTE_PAGA;

    if (contaPagar.saldo === contaPagar.valor_total) {
      contaPagar.data_liquidacao = undefined;
    }

    contaBancaria.saldo_atual += baixa.total;

    // Cria movimentação de ENTRADA para registrar o estorno
    // A movimentação original de saída permanece no histórico
    const movimentacaoEstorno = this.movimentacaoRepository.create({
      data: new Date(),
      descricao: `Estorno - ${contaPagar.documento} - Parcela ${contaPagar.parcela}${justificativa ? ` - ${justificativa}` : ''}`,
      conta: contaBancaria.banco,
      categoria: 'Estorno de Pagamento',
      valor: baixa.total,
      tipo: 'Entrada',
      contaBancaria,
      empresaId: contaPagar.empresa.id,
      planoContas: contaPagar.planoContas,
      referencia: TipoReferencia.PAGAR,
      observacao: justificativa,
    });

    baixa.deletadoEm = new Date();

    await this.baixaPagamentoRepository.persistAndFlush(baixa);
    await this.contaBancariaRepository.persistAndFlush(contaBancaria);
    await this.contaPagarRepository.persistAndFlush(contaPagar);
    await this.movimentacaoRepository.persistAndFlush(movimentacaoEstorno);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_PAGAR_UPDATED,
      severity: AuditSeverity.CRITICAL,
      resource: 'baixas_pagamento',
      action: 'ESTORNAR_BAIXA',
      success: true,
      userId,
      userEmail,
      empresaId: contaPagar.empresa.id,
      details: {
        message: `Baixa estornada para ${contaPagar.documento}`,
        baixaId: baixa.id,
        contaPagarId: contaPagar.id,
        valorEstornado: baixa.total,
        justificativa,
        saldoRestaurado: contaPagar.saldo,
      },
    });

    return baixa;
  }
}
