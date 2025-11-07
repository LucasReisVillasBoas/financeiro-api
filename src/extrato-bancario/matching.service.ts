import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { MovimentacoesBancariasRepository } from '../movimentacao-bancaria/movimentacao-bancaria.repository';
import type { TransacaoExtrato, SugestaoMatch } from './dto/importar-extrato.dto';

interface CriterioMatch {
  movimentacao: MovimentacoesBancarias;
  scoreData: number;
  scoreValor: number;
  scoreDescricao: number;
  scoreTotal: number;
  razoes: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
  ) {}

  async encontrarSugestoes(
    transacao: TransacaoExtrato,
    contaBancariaId: string,
  ): Promise<SugestaoMatch | null> {
    // Buscar movimentações não conciliadas em um intervalo de ±7 dias
    const dataInicio = new Date(transacao.data);
    dataInicio.setDate(dataInicio.getDate() - 7);

    const dataFim = new Date(transacao.data);
    dataFim.setDate(dataFim.getDate() + 7);

    const movimentacoes = await this.movimentacaoRepository.find({
      contaBancaria: contaBancariaId,
      conciliado: 'N',
      dataMovimento: {
        $gte: dataInicio,
        $lte: dataFim,
      },
      deletadoEm: null,
    });

    if (movimentacoes.length === 0) {
      return null;
    }

    // Calcular score para cada movimentação
    const candidatos: CriterioMatch[] = [];

    for (const movimentacao of movimentacoes) {
      const criterio = this.calcularScore(transacao, movimentacao);
      if (criterio.scoreTotal >= 50) {
        // Mínimo de 50% para considerar
        candidatos.push(criterio);
      }
    }

    if (candidatos.length === 0) {
      return null;
    }

    // Ordenar por score (maior para menor)
    candidatos.sort((a, b) => b.scoreTotal - a.scoreTotal);

    // Retornar a melhor sugestão
    const melhor = candidatos[0];

    return {
      movimentacaoId: melhor.movimentacao.id,
      score: Math.round(melhor.scoreTotal),
      razoes: melhor.razoes,
      movimentacao: {
        id: melhor.movimentacao.id,
        data: melhor.movimentacao.dataMovimento,
        descricao: melhor.movimentacao.descricao,
        valor: melhor.movimentacao.valor,
        tipo: melhor.movimentacao.tipoMovimento,
      },
    };
  }

  private calcularScore(
    transacao: TransacaoExtrato,
    movimentacao: MovimentacoesBancarias,
  ): CriterioMatch {
    const razoes: string[] = [];

    // 1. Score de Data (peso: 30%)
    const scoreData = this.calcularScoreData(
      transacao.data,
      movimentacao.dataMovimento,
      razoes,
    );

    // 2. Score de Valor (peso: 40%)
    const scoreValor = this.calcularScoreValor(
      transacao.valor,
      movimentacao.valor,
      razoes,
    );

    // 3. Score de Descrição (peso: 30%)
    const scoreDescricao = this.calcularScoreDescricao(
      transacao.descricao,
      movimentacao.descricao,
      razoes,
    );

    // 4. Validar tipo de transação
    const tipoValido = this.validarTipo(transacao.tipo, movimentacao.tipoMovimento);
    if (!tipoValido) {
      return {
        movimentacao,
        scoreData: 0,
        scoreValor: 0,
        scoreDescricao: 0,
        scoreTotal: 0,
        razoes: ['Tipo de transação incompatível'],
      };
    }

    // Score total ponderado
    const scoreTotal = scoreData * 0.3 + scoreValor * 0.4 + scoreDescricao * 0.3;

    return {
      movimentacao,
      scoreData,
      scoreValor,
      scoreDescricao,
      scoreTotal,
      razoes,
    };
  }

  private calcularScoreData(
    dataTransacao: Date,
    dataMovimentacao: Date,
    razoes: string[],
  ): number {
    const diferencaDias = Math.abs(
      Math.floor(
        (dataTransacao.getTime() - dataMovimentacao.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    if (diferencaDias === 0) {
      razoes.push('Data exata');
      return 100;
    } else if (diferencaDias === 1) {
      razoes.push('Data com 1 dia de diferença');
      return 90;
    } else if (diferencaDias === 2) {
      razoes.push('Data com 2 dias de diferença');
      return 80;
    } else if (diferencaDias <= 3) {
      razoes.push('Data com 3 dias de diferença');
      return 70;
    } else if (diferencaDias <= 5) {
      razoes.push(`Data com ${diferencaDias} dias de diferença`);
      return 50;
    } else {
      razoes.push(`Data com ${diferencaDias} dias de diferença`);
      return 30;
    }
  }

  private calcularScoreValor(
    valorTransacao: number,
    valorMovimentacao: number,
    razoes: string[],
  ): number {
    const diferenca = Math.abs(valorTransacao - valorMovimentacao);
    const percentual = (diferenca / valorTransacao) * 100;

    if (diferenca === 0) {
      razoes.push('Valor exato');
      return 100;
    } else if (percentual <= 0.01) {
      razoes.push('Valor quase exato (diferença < 0.01%)');
      return 95;
    } else if (percentual <= 1) {
      razoes.push('Valor muito próximo (diferença < 1%)');
      return 85;
    } else if (percentual <= 5) {
      razoes.push(`Valor próximo (diferença de ${percentual.toFixed(2)}%)`);
      return 60;
    } else if (percentual <= 10) {
      razoes.push(`Valor com diferença de ${percentual.toFixed(2)}%`);
      return 30;
    } else {
      return 0;
    }
  }

  private calcularScoreDescricao(
    descricaoTransacao: string,
    descricaoMovimentacao: string,
    razoes: string[],
  ): number {
    const desc1 = this.normalizarTexto(descricaoTransacao);
    const desc2 = this.normalizarTexto(descricaoMovimentacao);

    // Verificar igualdade exata
    if (desc1 === desc2) {
      razoes.push('Descrição idêntica');
      return 100;
    }

    // Verificar se uma contém a outra
    if (desc1.includes(desc2) || desc2.includes(desc1)) {
      razoes.push('Descrição contém a outra');
      return 80;
    }

    // Calcular similaridade por palavras
    const palavras1 = desc1.split(/\s+/);
    const palavras2 = desc2.split(/\s+/);

    const palavrasComuns = palavras1.filter((p) => palavras2.includes(p));
    const totalPalavras = Math.max(palavras1.length, palavras2.length);

    if (palavrasComuns.length === 0) {
      return 0;
    }

    const percentualComum = (palavrasComuns.length / totalPalavras) * 100;

    if (percentualComum >= 70) {
      razoes.push(`Descrição ${percentualComum.toFixed(0)}% similar`);
      return 70;
    } else if (percentualComum >= 50) {
      razoes.push(`Descrição ${percentualComum.toFixed(0)}% similar`);
      return 50;
    } else if (percentualComum >= 30) {
      razoes.push(`Descrição ${percentualComum.toFixed(0)}% similar`);
      return 30;
    } else {
      return 10;
    }
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .trim();
  }

  private validarTipo(tipoTransacao: 'debito' | 'credito', tipoMovimentacao: string): boolean {
    const tipoMovNormalizado = tipoMovimentacao.toLowerCase();

    if (tipoTransacao === 'debito') {
      return tipoMovNormalizado.includes('debito') || tipoMovNormalizado.includes('saída');
    } else {
      return tipoMovNormalizado.includes('credito') || tipoMovNormalizado.includes('entrada');
    }
  }
}
