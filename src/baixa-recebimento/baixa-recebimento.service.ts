import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BaixaRecebimentoRepository } from './baixa-recebimento.repository';
import { CreateBaixaRecebimentoDto } from './dto/create-baixa-recebimento.dto';
import { BaixaRecebimento } from '../entities/baixa-recebimento/baixa-recebimento.entity';
import {
  ContasReceber,
  StatusContaReceber,
} from '../entities/conta-receber/conta-receber.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import {
  MovimentacoesBancarias,
  TipoReferencia,
  TipoMovimento,
} from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasReceberRepository } from '../conta-receber/conta-receber.repository';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import { MovimentacoesBancariasRepository } from '../movimentacao-bancaria/movimentacao-bancaria.repository';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';

@Injectable()
export class BaixaRecebimentoService {
  constructor(
    @InjectRepository(BaixaRecebimento)
    private readonly baixaRecebimentoRepository: BaixaRecebimentoRepository,
    @InjectRepository(ContasReceber)
    private readonly contaReceberRepository: ContasReceberRepository,
    @InjectRepository(ContasBancarias)
    private readonly contaBancariaRepository: ContasBancariasRepository,
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Cria uma nova baixa de recebimento (parcial ou total)
   */
  async create(
    dto: CreateBaixaRecebimentoDto,
    userId: string,
    userEmail: string,
  ): Promise<BaixaRecebimento> {
    // 1. Busca e valida a conta a receber
    const contaReceber = await this.contaReceberRepository.findOne(
      { id: dto.contaReceberId, deletadoEm: null },
      { populate: ['empresa', 'planoContas', 'pessoa'] },
    );

    if (!contaReceber) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    // Valida se a conta não está cancelada
    if (contaReceber.status === StatusContaReceber.CANCELADO) {
      throw new BadRequestException(
        'Não é possível registrar baixa em conta cancelada',
      );
    }

    // Valida se a conta já não está totalmente liquidada
    if (contaReceber.saldo === 0) {
      throw new BadRequestException('Conta já está totalmente recebida');
    }

    // 2. Busca e valida a conta bancária
    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: dto.contaBancariaId,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    if (!contaBancaria.ativo) {
      throw new BadRequestException('Conta bancária está inativa');
    }

    // 3. Calcula o total da baixa
    const acrescimos = dto.acrescimos || 0;
    const descontos = dto.descontos || 0;
    const totalBaixa = Number((dto.valor + acrescimos - descontos).toFixed(2));

    // 4. Validações de valores
    if (totalBaixa <= 0) {
      throw new BadRequestException(
        'O total da baixa deve ser maior que zero',
      );
    }

    if (totalBaixa > contaReceber.saldo) {
      throw new BadRequestException(
        `Total da baixa (R$ ${totalBaixa.toFixed(2)}) não pode ser maior que o saldo a receber (R$ ${contaReceber.saldo.toFixed(2)})`,
      );
    }

    // 5. Registra saldos antes da atualização
    const saldoAnterior = contaReceber.saldo;

    // Atualiza o saldo da conta a receber
    contaReceber.saldo = Number((contaReceber.saldo - totalBaixa).toFixed(2));
    const saldoPosterior = contaReceber.saldo;

    // 6. Atualiza o status da conta a receber
    if (contaReceber.saldo === 0) {
      contaReceber.dataLiquidacao = new Date(dto.data);
      contaReceber.status = StatusContaReceber.LIQUIDADO;
    } else {
      contaReceber.status = StatusContaReceber.PARCIAL;
    }

    // 7. Cria a movimentação bancária (CRÉDITO = ENTRADA de dinheiro)
    const movimentacao = this.movimentacaoRepository.create({
      dataMovimento: new Date(dto.data),
      descricao: `Recebimento - ${contaReceber.descricao} - Parcela ${contaReceber.parcela}${dto.observacao ? ` - ${dto.observacao}` : ''}`,
      conta: contaBancaria.banco,
      categoria: 'RECEBIMENTO',
      valor: totalBaixa,
      tipoMovimento: TipoMovimento.CREDITO, // CRÉDITO conforme critério de aceite
      contaBancaria: contaBancaria,
      referencia: TipoReferencia.RECEBER,
      planoContas: contaReceber.planoContas,
      observacao: dto.observacao,
      conciliado: 'N', // Permite conciliação posterior no módulo bancário
    });

    // Atualiza o saldo da conta bancária (ADICIONA o valor recebido)
    contaBancaria.saldo_atual = Number(
      (contaBancaria.saldo_atual + totalBaixa).toFixed(2),
    );

    // 8. Cria o registro de baixa
    const baixa = this.baixaRecebimentoRepository.create({
      contaReceber,
      contaBancaria,
      data: new Date(dto.data),
      valor: dto.valor,
      acrescimos,
      descontos,
      total: totalBaixa,
      observacao: dto.observacao,
      saldoAnterior,
      saldoPosterior,
      criadoPorId: userId,
    });

    // 9. Persiste todas as alterações em transação
    await this.contaReceberRepository.persistAndFlush([
      contaReceber,
      contaBancaria,
      movimentacao,
      baixa,
    ]);

    // Vincula a movimentação bancária à baixa
    baixa.movimentacaoBancariaId = movimentacao.id;
    await this.contaReceberRepository.flush();

    // 10. Registra auditoria
    await this.auditService.log({
      eventType: AuditEventType.CONTA_RECEBER_UPDATED,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      empresaId: contaReceber.empresa?.id,
      details: {
        contaReceberId: contaReceber.id,
        baixaId: baixa.id,
        valorRecebido: totalBaixa,
        saldoAnterior,
        saldoPosterior,
        tipoBaixa: baixa.tipo,
        contaBancariaId: contaBancaria.id,
      },
      success: true,
      timestamp: new Date(),
    });

    return baixa;
  }

  /**
   * Lista todas as baixas de uma conta a receber
   */
  async findByContaReceber(contaReceberId: string): Promise<BaixaRecebimento[]> {
    return await this.baixaRecebimentoRepository.find(
      {
        contaReceber: { id: contaReceberId },
        deletadoEm: null,
      },
      {
        populate: ['contaReceber', 'contaBancaria'],
        orderBy: { data: 'DESC' },
      },
    );
  }

  /**
   * Lista todas as baixas
   */
  async findAll(): Promise<BaixaRecebimento[]> {
    return await this.baixaRecebimentoRepository.find(
      { deletadoEm: null },
      {
        populate: ['contaReceber', 'contaBancaria'],
        orderBy: { data: 'DESC' },
      },
    );
  }

  /**
   * Busca uma baixa por ID
   */
  async findOne(id: string): Promise<BaixaRecebimento> {
    const baixa = await this.baixaRecebimentoRepository.findOne(
      { id, deletadoEm: null },
      { populate: ['contaReceber', 'contaBancaria'] },
    );

    if (!baixa) {
      throw new NotFoundException('Baixa de recebimento não encontrada');
    }

    return baixa;
  }

  /**
   * Busca a movimentação bancária vinculada a uma baixa
   * Útil para conciliação bancária
   */
  async findMovimentacaoBancaria(baixaId: string): Promise<MovimentacoesBancarias | null> {
    const baixa = await this.findOne(baixaId);

    if (!baixa.movimentacaoBancariaId) {
      return null;
    }

    const movimentacao = await this.movimentacaoRepository.findOne({
      id: baixa.movimentacaoBancariaId,
    });

    return movimentacao;
  }

  /**
   * Estorna (cancela) uma baixa de recebimento
   */
  async estornar(
    id: string,
    userId: string,
    userEmail: string,
  ): Promise<BaixaRecebimento> {
    const baixa = await this.findOne(id);

    const contaReceber = await this.contaReceberRepository.findOne(
      { id: baixa.contaReceber.id },
      { populate: ['empresa'] },
    );

    if (!contaReceber) {
      throw new NotFoundException('Conta a receber não encontrada');
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      id: baixa.contaBancaria.id,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    // Valida se a conta bancária tem saldo suficiente para o estorno
    if (contaBancaria.saldo_atual < baixa.total) {
      throw new BadRequestException(
        `Saldo insuficiente na conta bancária para estorno. Saldo: R$ ${contaBancaria.saldo_atual.toFixed(2)}, Necessário: R$ ${baixa.total.toFixed(2)}`,
      );
    }

    // Restaura o saldo da conta a receber
    contaReceber.saldo = Number(
      (contaReceber.saldo + baixa.total).toFixed(2),
    );

    // Atualiza o status da conta a receber
    if (contaReceber.saldo > 0) {
      contaReceber.status = StatusContaReceber.PENDENTE;
      contaReceber.dataLiquidacao = undefined;
    }

    // Remove o valor da conta bancária (estorna a entrada)
    contaBancaria.saldo_atual = Number(
      (contaBancaria.saldo_atual - baixa.total).toFixed(2),
    );

    // Cria movimentação de estorno (DÉBITO = SAÍDA de dinheiro)
    const movimentacaoEstorno = this.movimentacaoRepository.create({
      dataMovimento: new Date(),
      descricao: `Estorno de recebimento - ${contaReceber.descricao} - Parcela ${contaReceber.parcela}`,
      conta: contaBancaria.banco,
      categoria: 'ESTORNO_RECEBIMENTO',
      valor: baixa.total,
      tipoMovimento: TipoMovimento.DEBITO, // DÉBITO para reverter o crédito
      contaBancaria: contaBancaria,
      referencia: TipoReferencia.RECEBER,
      planoContas: contaReceber.planoContas,
      observacao: `Estorno da baixa ID: ${baixa.id}`,
      conciliado: 'N',
    });

    // Marca a baixa como deletada (soft delete)
    baixa.deletadoEm = new Date();

    // Persiste todas as alterações
    await this.contaReceberRepository.persistAndFlush([
      contaReceber,
      contaBancaria,
      movimentacaoEstorno,
      baixa,
    ]);

    // Registra auditoria do estorno
    await this.auditService.log({
      eventType: AuditEventType.CONTA_RECEBER_UPDATED,
      severity: AuditSeverity.WARNING,
      userId,
      userEmail,
      empresaId: contaReceber.empresa?.id,
      details: {
        contaReceberId: contaReceber.id,
        baixaEstornadaId: baixa.id,
        valorEstornado: baixa.total,
        novoSaldo: contaReceber.saldo,
        acao: 'ESTORNO_BAIXA_RECEBIMENTO',
      },
      success: true,
      timestamp: new Date(),
    });

    return baixa;
  }
}
