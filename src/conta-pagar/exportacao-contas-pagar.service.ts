import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';
import { RelatorioContasPagar } from './interfaces/relatorio-contas-pagar.interface';
import { RelatorioContasPagarService } from './relatorio-contas-pagar.service';

@Injectable()
export class ExportacaoContasPagarService {
  constructor(private readonly relatorioService: RelatorioContasPagarService) {}

  async exportarCSV(relatorio: RelatorioContasPagar): Promise<Buffer> {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'documento', title: 'Documento' },
        { id: 'serie', title: 'Série' },
        { id: 'parcela', title: 'Parcela' },
        { id: 'fornecedor', title: 'Fornecedor' },
        { id: 'dataEmissao', title: 'Data Emissão' },
        { id: 'dataVencimento', title: 'Data Vencimento' },
        { id: 'dataLiquidacao', title: 'Data Liquidação' },
        { id: 'valorPrincipal', title: 'Valor Principal' },
        { id: 'acrescimos', title: 'Acréscimos' },
        { id: 'descontos', title: 'Descontos' },
        { id: 'valorTotal', title: 'Valor Total' },
        { id: 'saldo', title: 'Saldo' },
        { id: 'status', title: 'Status' },
        { id: 'empresa', title: 'Empresa' },
      ],
    });

    const records = relatorio.itens.map((item) => ({
      documento: item.documento,
      serie: item.serie || '',
      parcela: item.parcela,
      fornecedor: item.fornecedor,
      dataEmissao: this.relatorioService.formatarData(item.dataEmissao),
      dataVencimento: this.relatorioService.formatarData(item.dataVencimento),
      dataLiquidacao: this.relatorioService.formatarData(item.dataLiquidacao),
      valorPrincipal: item.valorPrincipal,
      acrescimos: item.acrescimos,
      descontos: item.descontos,
      valorTotal: item.valorTotal,
      saldo: item.saldo,
      status: this.relatorioService.formatarStatus(item.status),
      empresa: item.empresa,
    }));

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    // Adiciona totais ao final
    const totaisRow = [
      '',
      '',
      '',
      'TOTAIS:',
      '',
      '',
      '',
      relatorio.totais.valorTotal,
      '',
      '',
      relatorio.totais.valorTotal,
      relatorio.totais.saldo,
      '',
      '',
    ].join(',');

    const csv = header + body + '\n' + totaisRow;
    return Buffer.from(csv, 'utf-8');
  }

  async exportarExcel(relatorio: RelatorioContasPagar): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contas a Pagar');

    // Define colunas
    worksheet.columns = [
      { header: 'Documento', key: 'documento', width: 15 },
      { header: 'Série', key: 'serie', width: 10 },
      { header: 'Parcela', key: 'parcela', width: 10 },
      { header: 'Fornecedor', key: 'fornecedor', width: 30 },
      { header: 'Data Emissão', key: 'dataEmissao', width: 15 },
      { header: 'Data Vencimento', key: 'dataVencimento', width: 15 },
      { header: 'Data Liquidação', key: 'dataLiquidacao', width: 15 },
      { header: 'Valor Principal', key: 'valorPrincipal', width: 15 },
      { header: 'Acréscimos', key: 'acrescimos', width: 12 },
      { header: 'Descontos', key: 'descontos', width: 12 },
      { header: 'Valor Total', key: 'valorTotal', width: 15 },
      { header: 'Saldo', key: 'saldo', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Empresa', key: 'empresa', width: 25 },
    ];

    // Estilo do cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Adiciona dados
    relatorio.itens.forEach((item) => {
      worksheet.addRow({
        documento: item.documento,
        serie: item.serie || '',
        parcela: item.parcela,
        fornecedor: item.fornecedor,
        dataEmissao: this.relatorioService.formatarData(item.dataEmissao),
        dataVencimento: this.relatorioService.formatarData(item.dataVencimento),
        dataLiquidacao: this.relatorioService.formatarData(item.dataLiquidacao),
        valorPrincipal: Number(item.valorPrincipal),
        acrescimos: Number(item.acrescimos),
        descontos: Number(item.descontos),
        valorTotal: Number(item.valorTotal),
        saldo: Number(item.saldo),
        status: this.relatorioService.formatarStatus(item.status),
        empresa: item.empresa,
      });
    });

    // Adiciona linha de totais
    const totaisRow = worksheet.addRow({
      documento: '',
      serie: '',
      parcela: '',
      fornecedor: 'TOTAIS:',
      dataEmissao: '',
      dataVencimento: '',
      dataLiquidacao: '',
      valorPrincipal: '',
      acrescimos: '',
      descontos: '',
      valorTotal: relatorio.totais.valorTotal,
      saldo: relatorio.totais.saldo,
      status: '',
      empresa: '',
    });

    totaisRow.font = { bold: true };
    totaisRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' },
    };

    // Formata colunas de valores como moeda
    [8, 9, 10, 11, 12].forEach((colNum) => {
      worksheet.getColumn(colNum).numFmt = 'R$ #,##0.00';
    });

    // Adiciona aba de totais por fornecedor
    const worksheetFornecedor = workbook.addWorksheet('Totais por Fornecedor');
    worksheetFornecedor.columns = [
      { header: 'Fornecedor', key: 'fornecedor', width: 30 },
      { header: 'Quantidade', key: 'quantidade', width: 12 },
      { header: 'Valor Total', key: 'valorTotal', width: 15 },
      { header: 'Valor Pago', key: 'valorPago', width: 15 },
      { header: 'Saldo', key: 'saldo', width: 15 },
    ];

    worksheetFornecedor.getRow(1).font = { bold: true };
    worksheetFornecedor.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    relatorio.totaisPorFornecedor.forEach((total) => {
      worksheetFornecedor.addRow({
        fornecedor: total.fornecedor,
        quantidade: total.quantidade,
        valorTotal: Number(total.valorTotal),
        valorPago: Number(total.valorPago),
        saldo: Number(total.saldo),
      });
    });

    [3, 4, 5].forEach((colNum) => {
      worksheetFornecedor.getColumn(colNum).numFmt = 'R$ #,##0.00';
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async exportarPDF(relatorio: RelatorioContasPagar): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Título
      doc.fontSize(18).font('Helvetica-Bold').text('Relatório de Contas a Pagar', {
        align: 'center',
      });

      doc.moveDown();

      // Filtros aplicados
      doc.fontSize(10).font('Helvetica');
      if (relatorio.filtros.fornecedor) {
        doc.text(`Fornecedor: ${relatorio.filtros.fornecedor}`);
      }
      if (relatorio.filtros.dataInicial || relatorio.filtros.dataFinal) {
        const periodo = `Período: ${relatorio.filtros.dataInicial || 'Início'} até ${relatorio.filtros.dataFinal || 'Fim'}`;
        doc.text(periodo);
      }
      if (relatorio.filtros.status) {
        doc.text(`Status: ${this.relatorioService.formatarStatus(relatorio.filtros.status)}`);
      }
      doc.text(`Data de Geração: ${this.relatorioService.formatarData(relatorio.dataGeracao)}`);

      doc.moveDown();

      // Tabela de dados
      const tableTop = doc.y;
      const colWidths = [60, 30, 90, 60, 60, 60, 60, 60, 60];
      const headers = [
        'Documento',
        'Parc',
        'Fornecedor',
        'Vencimento',
        'Liquidação',
        'Valor Total',
        'Saldo',
        'Status',
        'Empresa',
      ];

      // Cabeçalho da tabela
      doc.fontSize(8).font('Helvetica-Bold');
      let x = 50;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.moveDown(0.5);
      let y = doc.y;

      // Linha divisória
      doc
        .moveTo(50, y)
        .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y)
        .stroke();

      y += 5;

      // Dados
      doc.fontSize(7).font('Helvetica');
      relatorio.itens.forEach((item) => {
        if (y > 500) {
          // Nova página se necessário
          doc.addPage();
          y = 50;
        }

        x = 50;
        const values = [
          item.documento,
          item.parcela.toString(),
          item.fornecedor.substring(0, 25),
          this.relatorioService.formatarData(item.dataVencimento),
          this.relatorioService.formatarData(item.dataLiquidacao),
          this.relatorioService.formatarMoeda(Number(item.valorTotal)),
          this.relatorioService.formatarMoeda(Number(item.saldo)),
          this.relatorioService.formatarStatus(item.status).substring(0, 15),
          item.empresa.substring(0, 20),
        ];

        values.forEach((value, i) => {
          doc.text(value, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });

        y += 15;
      });

      // Linha divisória antes dos totais
      doc
        .moveTo(50, y)
        .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y)
        .stroke();

      y += 10;

      // Totais
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(
        `TOTAIS: Quantidade: ${relatorio.totais.quantidade}   Valor Total: ${this.relatorioService.formatarMoeda(relatorio.totais.valorTotal)}   Saldo: ${this.relatorioService.formatarMoeda(relatorio.totais.saldo)}`,
        50,
        y,
      );

      // Nova página para totais por fornecedor
      if (relatorio.totaisPorFornecedor.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Totais por Fornecedor', { align: 'center' });
        doc.moveDown();

        const fornecedorTableTop = doc.y;
        const fornecedorColWidths = [200, 80, 120, 120, 120];
        const fornecedorHeaders = ['Fornecedor', 'Quantidade', 'Valor Total', 'Valor Pago', 'Saldo'];

        doc.fontSize(9).font('Helvetica-Bold');
        x = 50;
        fornecedorHeaders.forEach((header, i) => {
          doc.text(header, x, fornecedorTableTop, {
            width: fornecedorColWidths[i],
            align: 'left',
          });
          x += fornecedorColWidths[i];
        });

        doc.moveDown(0.5);
        y = doc.y;
        doc
          .moveTo(50, y)
          .lineTo(50 + fornecedorColWidths.reduce((a, b) => a + b, 0), y)
          .stroke();

        y += 5;

        doc.fontSize(8).font('Helvetica');
        relatorio.totaisPorFornecedor.forEach((total) => {
          x = 50;
          const values = [
            total.fornecedor,
            total.quantidade.toString(),
            this.relatorioService.formatarMoeda(Number(total.valorTotal)),
            this.relatorioService.formatarMoeda(Number(total.valorPago)),
            this.relatorioService.formatarMoeda(Number(total.saldo)),
          ];

          values.forEach((value, i) => {
            doc.text(value, x, y, { width: fornecedorColWidths[i], align: 'left' });
            x += fornecedorColWidths[i];
          });

          y += 15;

          if (y > 500) {
            doc.addPage();
            y = 50;
          }
        });
      }

      doc.end();
    });
  }
}
