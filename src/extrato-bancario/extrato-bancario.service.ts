import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ExtratoBancario, StatusExtratoItem } from '../entities/extrato-bancario/extrato-bancario.entity';
import { ExtratoBancarioRepository } from './extrato-bancario.repository';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import { MovimentacoesBancariasRepository } from '../movimentacao-bancaria/movimentacao-bancaria.repository';
import { OfxParser } from './parsers/ofx.parser';
import { CsvParser } from './parsers/csv.parser';
import { MatchingService } from './matching.service';
import {
  ImportarExtratoDto,
  FormatoExtrato,
  ResultadoImportacao,
  ItemExtratoImportado,
} from './dto/importar-extrato.dto';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';

@Injectable()
export class ExtratoBancarioService {
  constructor(
    @InjectRepository(ExtratoBancario)
    private readonly extratoRepository: ExtratoBancarioRepository,
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly contasBancariasRepository: ContasBancariasRepository,
    private readonly ofxParser: OfxParser,
    private readonly csvParser: CsvParser,
    private readonly matchingService: MatchingService,
    private readonly auditService: AuditService,
  ) {}

  async importar(
    dto: ImportarExtratoDto,
    userId: string,
    userEmail: string,
  ): Promise<ResultadoImportacao> {
    // Validar conta bancária
    const contaBancaria = await this.contasBancariasRepository.findOne({
      id: dto.contaBancariaId,
      deletadoEm: null,
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    // Parse do arquivo
    let transacoes;
    try {
      if (dto.formato === FormatoExtrato.OFX) {
        transacoes = await this.ofxParser.parse(dto.conteudo);
      } else if (dto.formato === FormatoExtrato.CSV) {
        transacoes = await this.csvParser.parse(dto.conteudo);
      } else {
        throw new BadRequestException('Formato não suportado');
      }
    } catch (error) {
      throw new BadRequestException(
        `Erro ao processar arquivo: ${error.message}`,
      );
    }

    if (!transacoes || transacoes.length === 0) {
      throw new BadRequestException('Nenhuma transação encontrada no arquivo');
    }

    // Processar cada transação
    const itensImportados: ExtratoBancario[] = [];
    let comSugestao = 0;
    let semSugestao = 0;

    for (const transacao of transacoes) {
      // Buscar sugestão de matching
      const sugestao = await this.matchingService.encontrarSugestoes(
        transacao,
        dto.contaBancariaId,
      );

      // Criar item do extrato
      const item = this.extratoRepository.create({
        contaBancaria,
        dataTransacao: transacao.data,
        descricao: transacao.descricao,
        documento: transacao.documento,
        valor: transacao.valor,
        tipoTransacao: transacao.tipo,
        status: sugestao ? StatusExtratoItem.SUGESTAO : StatusExtratoItem.PENDENTE,
        movimentacaoSugerida: sugestao
          ? await this.movimentacaoRepository.findOne(sugestao.movimentacaoId)
          : undefined,
        scoreMatch: sugestao ? sugestao.score : undefined,
        formatoOrigem: dto.formato,
        nomeArquivo: dto.nomeArquivo,
        empresaId: contaBancaria.empresa?.id,
        importadoPor: userId,
      });

      itensImportados.push(item);

      if (sugestao) {
        comSugestao++;
      } else {
        semSugestao++;
      }
    }

    // Persistir todos os itens
    await this.extratoRepository.getEntityManager().persistAndFlush(itensImportados);

    // Registrar auditoria
    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.MOVIMENTACAO_BANCARIA_CREATED,
      severity: AuditSeverity.INFO,
      resource: 'extratos_bancarios',
      action: 'IMPORTACAO_EXTRATO',
      success: true,
      userId,
      userEmail,
      empresaId: contaBancaria.empresa?.id,
      details: {
        message: `Importação de extrato: ${transacoes.length} transações`,
        contaBancariaId: dto.contaBancariaId,
        formato: dto.formato,
        nomeArquivo: dto.nomeArquivo,
        totalImportado: transacoes.length,
        comSugestao,
        semSugestao,
      },
    });

    // Montar resultado
    const itens: ItemExtratoImportado[] = await this.montarItensResultado(
      itensImportados,
    );

    return {
      totalImportado: transacoes.length,
      comSugestao,
      semSugestao,
      itens,
    };
  }

  async findAll(contaBancariaId?: string): Promise<ExtratoBancario[]> {
    const where: any = { deletadoEm: null };

    if (contaBancariaId) {
      where.contaBancaria = contaBancariaId;
    }

    return this.extratoRepository.find(where, {
      populate: ['contaBancaria', 'movimentacaoSugerida', 'movimentacaoConciliada'],
      orderBy: { dataTransacao: 'DESC' },
    });
  }

  async findPendentes(contaBancariaId: string): Promise<ExtratoBancario[]> {
    return this.extratoRepository.find(
      {
        contaBancaria: contaBancariaId,
        status: { $in: [StatusExtratoItem.PENDENTE, StatusExtratoItem.SUGESTAO] },
        deletadoEm: null,
      },
      {
        populate: ['contaBancaria', 'movimentacaoSugerida'],
        orderBy: { dataTransacao: 'DESC' },
      },
    );
  }

  async aceitarSugestao(
    itemId: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    const item = await this.extratoRepository.findOne(
      { id: itemId, deletadoEm: null },
      { populate: ['movimentacaoSugerida', 'contaBancaria'] },
    );

    if (!item) {
      throw new NotFoundException('Item do extrato não encontrado');
    }

    if (!item.movimentacaoSugerida) {
      throw new BadRequestException('Item não possui sugestão de conciliação');
    }

    if (item.status === StatusExtratoItem.CONCILIADO) {
      throw new BadRequestException('Item já está conciliado');
    }

    // Marcar movimentação como conciliada
    const movimentacao = item.movimentacaoSugerida;
    movimentacao.conciliado = 'S';
    movimentacao.conciliadoEm = new Date();
    movimentacao.conciliadoPor = userId;

    // Atualizar item do extrato
    item.status = StatusExtratoItem.CONCILIADO;
    item.movimentacaoConciliada = movimentacao;

    await this.extratoRepository.getEntityManager().persistAndFlush([item, movimentacao]);

    // Registrar auditoria
    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED,
      severity: AuditSeverity.INFO,
      resource: 'extratos_bancarios',
      action: 'CONCILIACAO_ACEITA',
      success: true,
      userId,
      userEmail,
      empresaId: item.empresaId,
      details: {
        message: 'Sugestão de conciliação aceita',
        extratoId: item.id,
        movimentacaoId: movimentacao.id,
        score: item.scoreMatch,
      },
    });
  }

  async rejeitarSugestao(
    itemId: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    const item = await this.extratoRepository.findOne(
      { id: itemId, deletadoEm: null },
      { populate: ['contaBancaria'] },
    );

    if (!item) {
      throw new NotFoundException('Item do extrato não encontrado');
    }

    // Marcar como pendente e remover sugestão
    item.status = StatusExtratoItem.PENDENTE;
    item.movimentacaoSugerida = undefined;
    item.scoreMatch = undefined;

    await this.extratoRepository.getEntityManager().persistAndFlush(item);

    // Registrar auditoria
    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED,
      severity: AuditSeverity.WARNING,
      resource: 'extratos_bancarios',
      action: 'CONCILIACAO_REJEITADA',
      success: true,
      userId,
      userEmail,
      empresaId: item.empresaId,
      details: {
        message: 'Sugestão de conciliação rejeitada',
        extratoId: item.id,
      },
    });
  }

  async ignorarItem(
    itemId: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    const item = await this.extratoRepository.findOne(
      { id: itemId, deletadoEm: null },
      { populate: ['contaBancaria'] },
    );

    if (!item) {
      throw new NotFoundException('Item do extrato não encontrado');
    }

    item.status = StatusExtratoItem.IGNORADO;

    await this.extratoRepository.getEntityManager().persistAndFlush(item);

    // Registrar auditoria
    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED,
      severity: AuditSeverity.INFO,
      resource: 'extratos_bancarios',
      action: 'ITEM_EXTRATO_IGNORADO',
      success: true,
      userId,
      userEmail,
      empresaId: item.empresaId,
      details: {
        message: 'Item do extrato ignorado',
        extratoId: item.id,
      },
    });
  }

  private async montarItensResultado(
    itens: ExtratoBancario[],
  ): Promise<ItemExtratoImportado[]> {
    const resultado: ItemExtratoImportado[] = [];

    for (const item of itens) {
      const itemResult: ItemExtratoImportado = {
        id: item.id,
        data: item.dataTransacao,
        descricao: item.descricao,
        valor: item.valor,
        tipo: item.tipoTransacao,
        status: item.status,
      };

      if (item.movimentacaoSugerida) {
        // Já carregado via populate

        itemResult.sugestao = {
          movimentacaoId: item.movimentacaoSugerida.id,
          score: item.scoreMatch || 0,
          razoes: [], // As razões já foram calculadas durante o matching
          movimentacao: {
            id: item.movimentacaoSugerida.id,
            data: item.movimentacaoSugerida.dataMovimento,
            descricao: item.movimentacaoSugerida.descricao,
            valor: item.movimentacaoSugerida.valor,
            tipo: item.movimentacaoSugerida.tipoMovimento,
          },
        };
      }

      resultado.push(itemResult);
    }

    return resultado;
  }
}
