import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MovimentacoesBancariasRepository } from './movimentacao-bancaria.repository';
import { CreateMovimentacoesBancariasDto } from './dto/create-movimentacao-bancaria.dto';
import { UpdateMovimentacoesBancariasDto } from './dto/update-movimentacao-bancaria.dto';
import { ConciliarMovimentacoesDto } from './dto/conciliar-movimentacoes.dto';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';

@Injectable()
export class MovimentacoesBancariasService {
  constructor(
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly contasBancariasRepository: ContasBancariasRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateMovimentacoesBancariasDto,
    userId?: string,
    userEmail?: string,
  ): Promise<MovimentacoesBancarias> {
    const contaBancaria = await this.contasBancariasRepository.findOne({
      id: dto.contaBancaria,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    // Compatibilidade: usar data se dataMovimento não fornecido
    const dataMovimentacao = dto.dataMovimento || dto.data;
    if (!dataMovimentacao) {
      throw new Error('Data do movimento é obrigatória');
    }

    // Compatibilidade: usar tipo se tipoMovimento não fornecido
    const tipoMov = dto.tipoMovimento || dto.tipo;
    if (!tipoMov) {
      throw new Error('Tipo de movimento é obrigatório');
    }

    const {
      contaBancaria: contaBancariaId,
      data,
      tipo,
      referencia,
      ...dadosMovimentacao
    } = dto;

    // Se referência não informada e é lançamento manual, definir como MANUAL
    const referenciaFinal = dto.referencia || 'Manual';

    const movimentacao = this.movimentacaoRepository.create({
      ...dadosMovimentacao,
      dataMovimento: new Date(dataMovimentacao),
      tipoMovimento: tipoMov as any,
      contaBancaria,
      conciliado: dto.conciliado || 'N',
      referencia: referenciaFinal as any,
    });

    // Calcular impacto no saldo baseado no tipo
    const isEntrada = tipoMov === 'Entrada' || tipoMov === 'Crédito';
    const valorMovimentacao = isEntrada ? dto.valor : -dto.valor;
    const saldoAnterior = contaBancaria.saldo_atual;
    contaBancaria.saldo_atual = contaBancaria.saldo_atual + valorMovimentacao;

    await this.movimentacaoRepository.persistAndFlush([
      movimentacao,
      contaBancaria,
    ]);

    // Auditoria para lançamentos manuais
    if (referenciaFinal === 'Manual' && userId) {
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.MOVIMENTACAO_BANCARIA_CREATED,
        severity: AuditSeverity.INFO,
        resource: 'movimentacoes_bancarias',
        action: 'LANCAMENTO_MANUAL',
        success: true,
        userId,
        userEmail: userEmail || 'unknown',
        empresaId: dto.empresaId,
        details: {
          message: `Lançamento manual: ${tipoMov} - ${dto.descricao}`,
          movimentacaoId: movimentacao.id,
          contaBancariaId: contaBancaria.id,
          valor: dto.valor,
          tipo: tipoMov,
          saldoAnterior,
          saldoAtual: contaBancaria.saldo_atual,
          observacao: dto.observacao,
        },
      });
    }

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
        dataMovimento: {
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
    const updateData = { ...dto } as any;

    // Compatibilidade: aceitar data ou dataMovimento
    const dataParaAtualizar = (dto as any).dataMovimento || (dto as any).data;
    if (dataParaAtualizar) {
      updateData.dataMovimento = new Date(dataParaAtualizar);
      delete updateData.data;
    }

    // Compatibilidade: aceitar tipo ou tipoMovimento
    const tipoParaAtualizar = (dto as any).tipoMovimento || (dto as any).tipo;
    if (tipoParaAtualizar) {
      updateData.tipoMovimento = tipoParaAtualizar;
      delete updateData.tipo;
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

  async conciliar(
    dto: ConciliarMovimentacoesDto,
    userId: string,
    userEmail: string,
  ): Promise<{ conciliadas: number; erros: string[] }> {
    const movimentacoes = await this.movimentacaoRepository.find({
      id: { $in: dto.movimentacaoIds },
      deletadoEm: null,
    });

    if (movimentacoes.length === 0) {
      throw new NotFoundException('Nenhuma movimentação encontrada');
    }

    const erros: string[] = [];
    const conciliadas: MovimentacoesBancarias[] = [];
    const dataConciliacao = new Date();

    for (const movimentacao of movimentacoes) {
      // Validar se já está conciliada
      if (movimentacao.conciliado === 'S') {
        erros.push(
          `Movimentação ${movimentacao.id} já está conciliada desde ${movimentacao.conciliadoEm?.toLocaleDateString('pt-BR')}`,
        );
        continue;
      }

      // Marcar como conciliada
      movimentacao.conciliado = 'S';
      movimentacao.conciliadoEm = dataConciliacao;
      movimentacao.conciliadoPor = userId;

      conciliadas.push(movimentacao);
    }

    // Persistir as movimentações conciliadas
    if (conciliadas.length > 0) {
      await this.movimentacaoRepository.persistAndFlush(conciliadas);

      // Registrar auditoria
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED,
        severity: AuditSeverity.INFO,
        resource: 'movimentacoes_bancarias',
        action: 'CONCILIACAO_MANUAL',
        success: true,
        userId,
        userEmail,
        details: {
          message: `Conciliação manual de ${conciliadas.length} movimentação(ões)`,
          movimentacaoIds: conciliadas.map((m) => m.id),
          dataConciliacao: dataConciliacao.toISOString(),
          quantidadeConciliadas: conciliadas.length,
          quantidadeErros: erros.length,
        },
      });
    }

    return {
      conciliadas: conciliadas.length,
      erros,
    };
  }

  async desconciliar(
    dto: ConciliarMovimentacoesDto,
    userId: string,
    userEmail: string,
  ): Promise<{ desconciliadas: number; erros: string[] }> {
    const movimentacoes = await this.movimentacaoRepository.find({
      id: { $in: dto.movimentacaoIds },
      deletadoEm: null,
    });

    if (movimentacoes.length === 0) {
      throw new NotFoundException('Nenhuma movimentação encontrada');
    }

    const erros: string[] = [];
    const desconciliadas: MovimentacoesBancarias[] = [];

    for (const movimentacao of movimentacoes) {
      // Validar se está conciliada
      if (movimentacao.conciliado === 'N') {
        erros.push(`Movimentação ${movimentacao.id} já está desconciliada`);
        continue;
      }

      // Marcar como não conciliada
      movimentacao.conciliado = 'N';
      movimentacao.conciliadoEm = undefined;
      movimentacao.conciliadoPor = undefined;

      desconciliadas.push(movimentacao);
    }

    // Persistir as movimentações desconciliadas
    if (desconciliadas.length > 0) {
      await this.movimentacaoRepository.persistAndFlush(desconciliadas);

      // Registrar auditoria
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED,
        severity: AuditSeverity.WARNING,
        resource: 'movimentacoes_bancarias',
        action: 'DESCONCILIACAO_MANUAL',
        success: true,
        userId,
        userEmail,
        details: {
          message: `Desconciliação manual de ${desconciliadas.length} movimentação(ões)`,
          movimentacaoIds: desconciliadas.map((m) => m.id),
          quantidadeDesconciliadas: desconciliadas.length,
          quantidadeErros: erros.length,
        },
      });
    }

    return {
      desconciliadas: desconciliadas.length,
      erros,
    };
  }
}
