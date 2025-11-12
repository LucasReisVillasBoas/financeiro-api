import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import type { TransacaoExtrato } from '../dto/importar-extrato.dto';

interface CsvRow {
  [key: string]: string;
}

@Injectable()
export class CsvParser {
  async parse(conteudo: Buffer): Promise<TransacaoExtrato[]> {
    try {
      const csvString = conteudo.toString('utf-8');

      // Parse do CSV
      const records: CsvRow[] = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      if (!records || records.length === 0) {
        throw new BadRequestException('Arquivo CSV vazio ou inválido');
      }

      // Detectar formato do CSV (identificar colunas)
      const primeiraLinha = records[0];
      const colunas = Object.keys(primeiraLinha).map((k) => k.toLowerCase());

      // Mapear colunas possíveis
      const mapeamento = this.detectarColunas(colunas);

      const transacoes: TransacaoExtrato[] = [];

      for (const row of records) {
        try {
          const transacao = this.extrairTransacao(row, mapeamento);
          if (transacao) {
            transacoes.push(transacao);
          }
        } catch (error) {
          // Continua com próxima linha se houver erro
          console.warn('Erro ao processar linha CSV:', error.message);
        }
      }

      if (transacoes.length === 0) {
        throw new BadRequestException(
          'Nenhuma transação válida encontrada no CSV',
        );
      }

      return transacoes;
    } catch (error) {
      throw new BadRequestException(`Erro ao processar CSV: ${error.message}`);
    }
  }

  private detectarColunas(colunas: string[]): {
    data: string;
    descricao: string;
    valor: string;
    tipo?: string;
    documento?: string;
  } {
    const mapeamento: any = {};

    // Detectar coluna de data
    mapeamento.data = colunas.find(
      (c) =>
        c.includes('data') ||
        c.includes('date') ||
        c === 'dt' ||
        c.includes('datamov'),
    );

    // Detectar coluna de descrição
    mapeamento.descricao = colunas.find(
      (c) =>
        c.includes('descri') ||
        c.includes('historico') ||
        c.includes('memo') ||
        c.includes('name'),
    );

    // Detectar coluna de valor
    mapeamento.valor = colunas.find(
      (c) =>
        c.includes('valor') ||
        c.includes('amount') ||
        c.includes('vl') ||
        c === 'value',
    );

    // Detectar coluna de tipo (débito/crédito)
    mapeamento.tipo = colunas.find(
      (c) =>
        c.includes('tipo') ||
        c.includes('type') ||
        c.includes('natureza') ||
        c === 'd/c',
    );

    // Detectar coluna de documento
    mapeamento.documento = colunas.find(
      (c) =>
        c.includes('documento') ||
        c.includes('doc') ||
        c.includes('numero') ||
        c.includes('ref'),
    );

    if (!mapeamento.data || !mapeamento.descricao || !mapeamento.valor) {
      throw new BadRequestException(
        'CSV inválido: colunas obrigatórias não encontradas (data, descrição, valor)',
      );
    }

    return mapeamento;
  }

  private extrairTransacao(
    row: CsvRow,
    mapeamento: any,
  ): TransacaoExtrato | null {
    // Extrair e validar data
    const dataStr = row[mapeamento.data];
    if (!dataStr) return null;

    const data = this.parseData(dataStr);
    if (!data) return null;

    // Extrair descrição
    const descricao = row[mapeamento.descricao] || 'Sem descrição';

    // Extrair e validar valor
    const valorStr = row[mapeamento.valor];
    if (!valorStr) return null;

    const valorParsed = this.parseValor(valorStr);
    if (valorParsed === null) return null;

    // Determinar tipo (débito ou crédito)
    let tipo: 'debito' | 'credito';
    const valor = Math.abs(valorParsed);

    if (mapeamento.tipo && row[mapeamento.tipo]) {
      const tipoStr = row[mapeamento.tipo].toLowerCase();
      if (tipoStr.includes('d') || tipoStr.includes('déb')) {
        tipo = 'debito';
      } else if (tipoStr.includes('c') || tipoStr.includes('créd')) {
        tipo = 'credito';
      } else {
        tipo = valorParsed < 0 ? 'debito' : 'credito';
      }
    } else {
      tipo = valorParsed < 0 ? 'debito' : 'credito';
    }

    // Extrair documento (opcional)
    const documento = mapeamento.documento
      ? row[mapeamento.documento]
      : undefined;

    return {
      data,
      descricao,
      documento,
      valor,
      tipo,
    };
  }

  private parseData(dataStr: string): Date | null {
    // Tentar vários formatos de data
    const formatos = [
      // DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // DD-MM-YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/,
      // YYYYMMDD
      /^(\d{4})(\d{2})(\d{2})$/,
    ];

    for (const formato of formatos) {
      const match = dataStr.match(formato);
      if (match) {
        let ano: number, mes: number, dia: number;

        if (formato.source.startsWith('^\\(\\d{4}')) {
          // Formato YYYY-MM-DD ou YYYYMMDD
          ano = parseInt(match[1]);
          mes = parseInt(match[2]) - 1;
          dia = parseInt(match[3]);
        } else {
          // Formato DD/MM/YYYY ou DD-MM-YYYY
          dia = parseInt(match[1]);
          mes = parseInt(match[2]) - 1;
          ano = parseInt(match[3]);
        }

        const data = new Date(ano, mes, dia);
        if (!isNaN(data.getTime())) {
          return data;
        }
      }
    }

    return null;
  }

  private parseValor(valorStr: string): number | null {
    // Remover símbolos de moeda e espaços
    let valor = valorStr
      .replace(/[R$\s]/g, '')
      .replace(/[^\d,.-]/g, '')
      .trim();

    // Detectar se usa vírgula ou ponto como separador decimal
    const temVirgula = valor.includes(',');
    const temPonto = valor.includes('.');

    if (temVirgula && temPonto) {
      // Formato brasileiro: 1.234,56
      if (valor.lastIndexOf(',') > valor.lastIndexOf('.')) {
        valor = valor.replace(/\./g, '').replace(',', '.');
      }
      // Formato americano: 1,234.56
      else {
        valor = valor.replace(/,/g, '');
      }
    } else if (temVirgula) {
      // Apenas vírgula: assume formato brasileiro
      valor = valor.replace(',', '.');
    }

    const numero = parseFloat(valor);
    return isNaN(numero) ? null : numero;
  }
}
