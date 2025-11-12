import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MovimentacoesBancariasRepository } from './movimentacao-bancaria.repository';
import { ContasBancariasRepository } from '../conta-bancaria/conta-bancaria.repository';
import { FiltroRelatorioMovimentacoesDto } from './dto/filtro-relatorio-movimentacoes.dto';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export interface ResumoMovimentacoes {
  totalCreditos: number;
  totalDebitos: number;
  saldoInicial: number;
  saldoFinal: number;
  saldoAtual: number;
  quantidadeMovimentacoes: number;
  quantidadeConciliadas: number;
  quantidadeNaoConciliadas: number;
}

export interface MovimentacaoDiaria {
  data: string;
  creditos: number;
  debitos: number;
  saldo: number;
  movimentacoes: number;
}

export interface RelatorioMovimentacoes {
  filtros: FiltroRelatorioMovimentacoesDto;
  contaBancaria?: {
    id: string;
    banco: string;
    agencia: string;
    conta: string;
    saldo_atual: number;
  };
  resumo: ResumoMovimentacoes;
  movimentacoes: MovimentacoesBancarias[];
  movimentacoesDiarias: MovimentacaoDiaria[];
  geradoEm: Date;
}

@Injectable()
export class RelatorioMovimentacoesService {
  constructor(
    @InjectRepository(MovimentacoesBancarias)
    private readonly movimentacaoRepository: MovimentacoesBancariasRepository,
    private readonly contasBancariasRepository: ContasBancariasRepository,
  ) {}

  async gerarRelatorio(
    filtros: FiltroRelatorioMovimentacoesDto,
  ): Promise<RelatorioMovimentacoes> {
    // Buscar conta bancária se filtro fornecido
    let contaBancaria = null;
    if (filtros.contaBancariaId) {
      contaBancaria = await this.contasBancariasRepository.findOne({
        id: filtros.contaBancariaId,
        deletadoEm: null,
      });

      if (!contaBancaria) {
        throw new NotFoundException('Conta bancária não encontrada');
      }
    }

    // Construir filtros de busca
    const where: any = { deletadoEm: null };

    if (filtros.contaBancariaId) {
      where.contaBancaria = filtros.contaBancariaId;
    }

    if (filtros.dataInicio && filtros.dataFim) {
      where.dataMovimento = {
        $gte: new Date(filtros.dataInicio),
        $lte: new Date(filtros.dataFim),
      };
    } else if (filtros.dataInicio) {
      where.dataMovimento = {
        $gte: new Date(filtros.dataInicio),
      };
    } else if (filtros.dataFim) {
      where.dataMovimento = {
        $lte: new Date(filtros.dataFim),
      };
    }

    if (filtros.conciliado && filtros.conciliado !== 'TODOS') {
      where.conciliado = filtros.conciliado;
    }

    if (filtros.empresaId) {
      where.empresaId = filtros.empresaId;
    }

    // Buscar movimentações
    const movimentacoes = await this.movimentacaoRepository.find(where, {
      populate: ['contaBancaria'],
      orderBy: { dataMovimento: 'ASC' },
    });

    // Calcular saldo inicial
    let saldoInicial = 0;
    if (filtros.contaBancariaId && filtros.dataInicio) {
      saldoInicial = await this.calcularSaldoInicial(
        filtros.contaBancariaId,
        new Date(filtros.dataInicio),
      );
    }

    // Calcular resumo
    const resumo = this.calcularResumo(movimentacoes, saldoInicial);

    // Calcular movimentações diárias
    const movimentacoesDiarias = this.calcularMovimentacoesDiarias(
      movimentacoes,
      saldoInicial,
    );

    return {
      filtros,
      contaBancaria: contaBancaria
        ? {
            id: contaBancaria.id,
            banco: contaBancaria.banco,
            agencia: contaBancaria.agencia,
            conta: contaBancaria.conta,
            saldo_atual: contaBancaria.saldo_atual,
          }
        : undefined,
      resumo,
      movimentacoes,
      movimentacoesDiarias,
      geradoEm: new Date(),
    };
  }

  private async calcularSaldoInicial(
    contaBancariaId: string,
    dataInicio: Date,
  ): Promise<number> {
    // Buscar todas as movimentações ANTES da data inicial
    const movimentacoesAnteriores = await this.movimentacaoRepository.find({
      contaBancaria: contaBancariaId,
      dataMovimento: { $lt: dataInicio },
      deletadoEm: null,
    });

    // Buscar saldo inicial da conta (pode ser zero se não tiver movimentações)
    const conta = await this.contasBancariasRepository.findOne({
      id: contaBancariaId,
    });

    if (!conta) return 0;

    // Calcular saldo inicial baseado no saldo atual menos movimentações após a data
    const movimentacoesPosteriores = await this.movimentacaoRepository.find({
      contaBancaria: contaBancariaId,
      dataMovimento: { $gte: dataInicio },
      deletadoEm: null,
    });

    let saldoInicial = conta.saldo_atual;

    // Reverter movimentações posteriores
    movimentacoesPosteriores.forEach((mov) => {
      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';
      saldoInicial -= isEntrada ? mov.valor : -mov.valor;
    });

    return saldoInicial;
  }

  private calcularResumo(
    movimentacoes: MovimentacoesBancarias[],
    saldoInicial: number,
  ): ResumoMovimentacoes {
    let totalCreditos = 0;
    let totalDebitos = 0;
    let quantidadeConciliadas = 0;
    let quantidadeNaoConciliadas = 0;

    movimentacoes.forEach((mov) => {
      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';

      if (isEntrada) {
        totalCreditos += mov.valor;
      } else {
        totalDebitos += mov.valor;
      }

      if (mov.conciliado === 'S') {
        quantidadeConciliadas++;
      } else {
        quantidadeNaoConciliadas++;
      }
    });

    const saldoFinal = saldoInicial + totalCreditos - totalDebitos;

    return {
      totalCreditos,
      totalDebitos,
      saldoInicial,
      saldoFinal,
      saldoAtual: saldoFinal,
      quantidadeMovimentacoes: movimentacoes.length,
      quantidadeConciliadas,
      quantidadeNaoConciliadas,
    };
  }

  private calcularMovimentacoesDiarias(
    movimentacoes: MovimentacoesBancarias[],
    saldoInicial: number,
  ): MovimentacaoDiaria[] {
    const porDia: { [data: string]: MovimentacaoDiaria } = {};

    let saldoAcumulado = saldoInicial;

    movimentacoes.forEach((mov) => {
      const dataStr = mov.dataMovimento.toISOString().split('T')[0];

      if (!porDia[dataStr]) {
        porDia[dataStr] = {
          data: dataStr,
          creditos: 0,
          debitos: 0,
          saldo: saldoAcumulado,
          movimentacoes: 0,
        };
      }

      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';

      if (isEntrada) {
        porDia[dataStr].creditos += mov.valor;
        saldoAcumulado += mov.valor;
      } else {
        porDia[dataStr].debitos += mov.valor;
        saldoAcumulado -= mov.valor;
      }

      porDia[dataStr].saldo = saldoAcumulado;
      porDia[dataStr].movimentacoes++;
    });

    return Object.values(porDia).sort((a, b) => a.data.localeCompare(b.data));
  }

  async exportarCSV(filtros: FiltroRelatorioMovimentacoesDto): Promise<string> {
    const relatorio = await this.gerarRelatorio(filtros);

    let csv = 'Data,Descrição,Categoria,Tipo,Valor,Conciliado,Observação\n';

    relatorio.movimentacoes.forEach((mov) => {
      const data = mov.dataMovimento.toISOString().split('T')[0];
      const descricao = this.escaparCSV(mov.descricao);
      const categoria = this.escaparCSV(mov.categoria);
      const tipo = mov.tipoMovimento;
      const valor = mov.valor.toFixed(2);
      const conciliado = mov.conciliado;
      const observacao = this.escaparCSV(mov.observacao || '');

      csv += `${data},${descricao},${categoria},${tipo},${valor},${conciliado},${observacao}\n`;
    });

    // Adicionar linha de totais
    csv += '\n';
    csv += `RESUMO\n`;
    csv += `Total Créditos,${relatorio.resumo.totalCreditos.toFixed(2)}\n`;
    csv += `Total Débitos,${relatorio.resumo.totalDebitos.toFixed(2)}\n`;
    csv += `Saldo Inicial,${relatorio.resumo.saldoInicial.toFixed(2)}\n`;
    csv += `Saldo Final,${relatorio.resumo.saldoFinal.toFixed(2)}\n`;

    return csv;
  }

  private escaparCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async exportarExcel(
    filtros: FiltroRelatorioMovimentacoesDto,
  ): Promise<Buffer> {
    const relatorio = await this.gerarRelatorio(filtros);

    // Preparar dados para Excel
    const dados = relatorio.movimentacoes.map((mov) => ({
      Data: mov.dataMovimento.toISOString().split('T')[0],
      Descrição: mov.descricao,
      Categoria: mov.categoria,
      Tipo: mov.tipoMovimento,
      Valor: mov.valor,
      Conciliado: mov.conciliado,
      Observação: mov.observacao || '',
    }));

    // Adicionar linha de resumo
    dados.push({} as any);
    dados.push({ Data: 'RESUMO' } as any);
    dados.push({
      Data: 'Total Créditos',
      Descrição: relatorio.resumo.totalCreditos.toFixed(2),
    } as any);
    dados.push({
      Data: 'Total Débitos',
      Descrição: relatorio.resumo.totalDebitos.toFixed(2),
    } as any);
    dados.push({
      Data: 'Saldo Inicial',
      Descrição: relatorio.resumo.saldoInicial.toFixed(2),
    } as any);
    dados.push({
      Data: 'Saldo Final',
      Descrição: relatorio.resumo.saldoFinal.toFixed(2),
    } as any);

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dados);

    // Configurar largura das colunas
    worksheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 40 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 10 }, // Tipo
      { wch: 15 }, // Valor
      { wch: 12 }, // Conciliado
      { wch: 40 }, // Observação
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');

    // Gerar buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return Buffer.from(excelBuffer);
  }

  async exportarPDF(filtros: FiltroRelatorioMovimentacoesDto): Promise<Buffer> {
    const relatorio = await this.gerarRelatorio(filtros);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho
      doc
        .fontSize(20)
        .text('Relatório de Movimentações Bancárias', { align: 'center' });
      doc.moveDown();

      // Informações do filtro
      doc.fontSize(12);
      if (filtros.dataInicio && filtros.dataFim) {
        doc.text(`Período: ${filtros.dataInicio} a ${filtros.dataFim}`);
      } else if (filtros.dataInicio) {
        doc.text(`A partir de: ${filtros.dataInicio}`);
      } else if (filtros.dataFim) {
        doc.text(`Até: ${filtros.dataFim}`);
      }

      if (relatorio.contaBancaria) {
        doc.text(
          `Conta: ${relatorio.contaBancaria.banco} - Ag: ${relatorio.contaBancaria.agencia} - C/C: ${relatorio.contaBancaria.conta}`,
        );
      }

      doc.moveDown();

      // Resumo
      doc.fontSize(14).text('Resumo', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Saldo Inicial: R$ ${relatorio.resumo.saldoInicial.toFixed(2)}`);
      doc.text(
        `Total Créditos: R$ ${relatorio.resumo.totalCreditos.toFixed(2)}`,
      );
      doc.text(`Total Débitos: R$ ${relatorio.resumo.totalDebitos.toFixed(2)}`);
      doc.text(`Saldo Final: R$ ${relatorio.resumo.saldoFinal.toFixed(2)}`, {
        underline: true,
      });
      doc.text(
        `Quantidade de Movimentações: ${relatorio.resumo.quantidadeMovimentacoes}`,
      );
      doc.text(
        `Conciliadas: ${relatorio.resumo.quantidadeConciliadas} | Não Conciliadas: ${relatorio.resumo.quantidadeNaoConciliadas}`,
      );

      doc.moveDown();

      // Movimentações
      doc.fontSize(14).text('Movimentações', { underline: true });
      doc.moveDown(0.5);

      // Cabeçalho da tabela
      doc.fontSize(8);
      const startY = doc.y;
      const colWidths = {
        data: 60,
        descricao: 150,
        tipo: 50,
        valor: 70,
        conciliado: 60,
      };

      doc.text('Data', 50, startY);
      doc.text('Descrição', 50 + colWidths.data, startY);
      doc.text('Tipo', 50 + colWidths.data + colWidths.descricao, startY);
      doc.text(
        'Valor',
        50 + colWidths.data + colWidths.descricao + colWidths.tipo,
        startY,
      );
      doc.text(
        'Conciliado',
        50 +
          colWidths.data +
          colWidths.descricao +
          colWidths.tipo +
          colWidths.valor,
        startY,
      );

      doc.moveDown();

      // Linhas de dados
      relatorio.movimentacoes.forEach((mov) => {
        const y = doc.y;

        // Verificar se precisa de nova página
        if (y > 700) {
          doc.addPage();
        }

        const data = mov.dataMovimento.toISOString().split('T')[0];
        const descricao =
          mov.descricao.length > 30
            ? mov.descricao.substring(0, 27) + '...'
            : mov.descricao;
        const tipo = mov.tipoMovimento;
        const valor = `R$ ${mov.valor.toFixed(2)}`;
        const conciliado = mov.conciliado;

        doc.text(data, 50, y);
        doc.text(descricao, 50 + colWidths.data, y);
        doc.text(tipo, 50 + colWidths.data + colWidths.descricao, y);
        doc.text(
          valor,
          50 + colWidths.data + colWidths.descricao + colWidths.tipo,
          y,
        );
        doc.text(
          conciliado,
          50 +
            colWidths.data +
            colWidths.descricao +
            colWidths.tipo +
            colWidths.valor,
          y,
        );

        doc.moveDown(0.5);
      });

      // Rodapé
      doc.moveDown();
      doc
        .fontSize(8)
        .text(`Gerado em: ${relatorio.geradoEm.toLocaleString('pt-BR')}`, {
          align: 'center',
        });

      doc.end();
    });
  }
}
