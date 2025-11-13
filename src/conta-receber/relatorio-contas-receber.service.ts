import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ContasReceberRepository } from './conta-receber.repository';
import {
  ContasReceber,
  StatusContaReceber,
} from '../entities/conta-receber/conta-receber.entity';
import {
  RelatorioContasReceberDto,
  RelatorioTotaisDto,
  RelatorioContaReceberItem,
} from './dto/relatorio-contas-receber.dto';
import { FilterQuery } from '@mikro-orm/core';

@Injectable()
export class RelatorioContasReceberService {
  constructor(
    @InjectRepository(ContasReceber)
    private readonly contaReceberRepository: ContasReceberRepository,
  ) {}

  /**
   * Gera relatório de contas a receber com filtros
   */
  async gerarRelatorio(
    filtros: RelatorioContasReceberDto,
  ): Promise<{ dados: RelatorioContaReceberItem[]; totais: RelatorioTotaisDto }> {
    const where = this.construirFiltros(filtros);

    const contas = await this.contaReceberRepository.find(where, {
      populate: ['pessoa', 'empresa', 'planoContas'],
      orderBy: { vencimento: 'ASC' },
    });

    const dados = contas.map((conta) => this.mapearParaItem(conta));
    const totais = this.calcularTotais(dados);

    return { dados, totais };
  }

  /**
   * Constrói os filtros para a consulta
   */
  private construirFiltros(
    filtros: RelatorioContasReceberDto,
  ): FilterQuery<ContasReceber> {
    const where: FilterQuery<ContasReceber> = {
      deletadoEm: null,
    };

    // Filtro por pessoa (cliente)
    if (filtros.pessoaId) {
      where.pessoa = { id: filtros.pessoaId };
    }

    // Filtro por empresa
    if (filtros.empresaId) {
      where.empresa = { id: filtros.empresaId };
    }

    // Filtro por status
    if (filtros.status) {
      where.status = filtros.status;
    }

    // Filtro por período
    if (filtros.dataInicio || filtros.dataFim) {
      const campoData = this.getCampoDataPorTipo(filtros.tipoPeriodo || 'vencimento');

      if (filtros.dataInicio && filtros.dataFim) {
        where[campoData] = {
          $gte: new Date(filtros.dataInicio),
          $lte: new Date(filtros.dataFim),
        };
      } else if (filtros.dataInicio) {
        where[campoData] = { $gte: new Date(filtros.dataInicio) };
      } else if (filtros.dataFim) {
        where[campoData] = { $lte: new Date(filtros.dataFim) };
      }
    }

    return where;
  }

  /**
   * Retorna o campo de data baseado no tipo de período
   */
  private getCampoDataPorTipo(tipoPeriodo: 'emissao' | 'vencimento' | 'liquidacao'): string {
    const mapeamento = {
      emissao: 'dataEmissao',
      vencimento: 'vencimento',
      liquidacao: 'dataLiquidacao',
    };
    return mapeamento[tipoPeriodo];
  }

  /**
   * Mapeia entidade para item do relatório
   */
  private mapearParaItem(conta: ContasReceber): RelatorioContaReceberItem {
    return {
      id: conta.id,
      documento: conta.documento,
      serie: conta.serie,
      parcela: conta.parcela,
      tipo: conta.tipo,
      dataEmissao: conta.dataEmissao,
      vencimento: conta.vencimento,
      dataLiquidacao: conta.dataLiquidacao || null,
      pessoaNome: conta.pessoa?.razaoNome || conta.pessoa?.fantasiaApelido || '',
      pessoaDocumento: conta.pessoa?.documento || '',
      descricao: conta.descricao,
      valorPrincipal: conta.valorPrincipal,
      valorAcrescimos: conta.valorAcrescimos,
      valorDescontos: conta.valorDescontos,
      valorTotal: conta.valorTotal,
      saldo: conta.saldo,
      status: conta.status,
      planoContasDescricao: conta.planoContas?.descricao || '',
      empresaNome: conta.empresa?.razao_social || '',
    };
  }

  /**
   * Calcula os totais do relatório
   */
  private calcularTotais(dados: RelatorioContaReceberItem[]): RelatorioTotaisDto {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Totais gerais
    const totalRegistros = dados.length;
    const valorTotal = dados.reduce((sum, item) => sum + item.valorTotal, 0);
    const valorRecebido = dados.reduce(
      (sum, item) => sum + (item.valorTotal - item.saldo),
      0,
    );
    const valorPendente = dados.reduce(
      (sum, item) => sum + (item.status !== StatusContaReceber.LIQUIDADO ? item.saldo : 0),
      0,
    );
    const valorVencido = dados.reduce((sum, item) => {
      if (
        item.status !== StatusContaReceber.LIQUIDADO &&
        item.vencimento < hoje
      ) {
        return sum + item.saldo;
      }
      return sum;
    }, 0);

    // Totais por cliente
    const totaisPorCliente = this.calcularTotaisPorCliente(dados, hoje);

    // Totais por período
    const totaisPorPeriodo = this.calcularTotaisPorPeriodo(dados);

    return {
      totalRegistros,
      valorTotal: Number(valorTotal.toFixed(2)),
      valorRecebido: Number(valorRecebido.toFixed(2)),
      valorPendente: Number(valorPendente.toFixed(2)),
      valorVencido: Number(valorVencido.toFixed(2)),
      totaisPorCliente,
      totaisPorPeriodo,
    };
  }

  /**
   * Calcula totais agrupados por cliente
   */
  private calcularTotaisPorCliente(
    dados: RelatorioContaReceberItem[],
    hoje: Date,
  ) {
    const grupos = new Map<string, any>();

    dados.forEach((item) => {
      const key = item.pessoaNome;

      if (!grupos.has(key)) {
        grupos.set(key, {
          pessoaId: item.id,
          pessoaNome: item.pessoaNome,
          totalTitulos: 0,
          valorTotal: 0,
          valorRecebido: 0,
          valorPendente: 0,
        });
      }

      const grupo = grupos.get(key);
      grupo.totalTitulos++;
      grupo.valorTotal += item.valorTotal;
      grupo.valorRecebido += item.valorTotal - item.saldo;

      if (item.status !== StatusContaReceber.LIQUIDADO) {
        grupo.valorPendente += item.saldo;
      }
    });

    return Array.from(grupos.values()).map((grupo) => ({
      ...grupo,
      valorTotal: Number(grupo.valorTotal.toFixed(2)),
      valorRecebido: Number(grupo.valorRecebido.toFixed(2)),
      valorPendente: Number(grupo.valorPendente.toFixed(2)),
    }));
  }

  /**
   * Calcula totais agrupados por período (mês/ano)
   */
  private calcularTotaisPorPeriodo(dados: RelatorioContaReceberItem[]) {
    const grupos = new Map<string, any>();

    dados.forEach((item) => {
      const periodo = this.formatarPeriodo(item.vencimento);

      if (!grupos.has(periodo)) {
        grupos.set(periodo, {
          periodo,
          totalTitulos: 0,
          valorTotal: 0,
          valorRecebido: 0,
          valorPendente: 0,
        });
      }

      const grupo = grupos.get(periodo);
      grupo.totalTitulos++;
      grupo.valorTotal += item.valorTotal;
      grupo.valorRecebido += item.valorTotal - item.saldo;

      if (item.status !== StatusContaReceber.LIQUIDADO) {
        grupo.valorPendente += item.saldo;
      }
    });

    return Array.from(grupos.values())
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((grupo) => ({
        ...grupo,
        valorTotal: Number(grupo.valorTotal.toFixed(2)),
        valorRecebido: Number(grupo.valorRecebido.toFixed(2)),
        valorPendente: Number(grupo.valorPendente.toFixed(2)),
      }));
  }

  /**
   * Formata data para período (YYYY-MM)
   */
  private formatarPeriodo(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  }

  /**
   * Exporta relatório em formato CSV
   */
  async exportarCSV(filtros: RelatorioContasReceberDto): Promise<string> {
    const { dados, totais } = await this.gerarRelatorio(filtros);

    const linhas: string[] = [];

    // Cabeçalho
    linhas.push(
      [
        'Documento',
        'Série',
        'Parcela',
        'Tipo',
        'Data Emissão',
        'Vencimento',
        'Data Liquidação',
        'Cliente',
        'CPF/CNPJ',
        'Descrição',
        'Valor Principal',
        'Acréscimos',
        'Descontos',
        'Valor Total',
        'Saldo',
        'Status',
        'Plano de Contas',
        'Empresa',
      ].join(';'),
    );

    // Dados
    dados.forEach((item) => {
      linhas.push(
        [
          item.documento,
          item.serie,
          item.parcela,
          item.tipo,
          this.formatarData(item.dataEmissao),
          this.formatarData(item.vencimento),
          item.dataLiquidacao ? this.formatarData(item.dataLiquidacao) : '',
          item.pessoaNome,
          item.pessoaDocumento,
          item.descricao,
          this.formatarMoeda(item.valorPrincipal),
          this.formatarMoeda(item.valorAcrescimos),
          this.formatarMoeda(item.valorDescontos),
          this.formatarMoeda(item.valorTotal),
          this.formatarMoeda(item.saldo),
          item.status,
          item.planoContasDescricao,
          item.empresaNome,
        ].join(';'),
      );
    });

    // Totais
    linhas.push('');
    linhas.push('TOTAIS GERAIS');
    linhas.push(`Total de Registros;${totais.totalRegistros}`);
    linhas.push(`Valor Total;${this.formatarMoeda(totais.valorTotal)}`);
    linhas.push(`Valor Recebido;${this.formatarMoeda(totais.valorRecebido)}`);
    linhas.push(`Valor Pendente;${this.formatarMoeda(totais.valorPendente)}`);
    linhas.push(`Valor Vencido;${this.formatarMoeda(totais.valorVencido)}`);

    return linhas.join('\n');
  }

  /**
   * Exporta relatório em formato Excel
   */
  async exportarExcel(filtros: RelatorioContasReceberDto): Promise<Buffer> {
    const XLSX = require('xlsx');
    const { dados, totais } = await this.gerarRelatorio(filtros);

    // Prepara dados para o Excel
    const worksheetData = dados.map((item) => ({
      Documento: item.documento,
      Série: item.serie,
      Parcela: item.parcela,
      Tipo: item.tipo,
      'Data Emissão': this.formatarData(item.dataEmissao),
      Vencimento: this.formatarData(item.vencimento),
      'Data Liquidação': item.dataLiquidacao ? this.formatarData(item.dataLiquidacao) : '',
      Cliente: item.pessoaNome,
      'CPF/CNPJ': item.pessoaDocumento,
      Descrição: item.descricao,
      'Valor Principal': item.valorPrincipal,
      Acréscimos: item.valorAcrescimos,
      Descontos: item.valorDescontos,
      'Valor Total': item.valorTotal,
      Saldo: item.saldo,
      Status: item.status,
      'Plano de Contas': item.planoContasDescricao,
      Empresa: item.empresaNome,
    }));

    // Cria worksheet com os dados
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Adiciona linha de totais
    const totalRow = worksheetData.length + 2;
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['TOTAIS GERAIS'],
        ['Total de Registros', totais.totalRegistros],
        ['Valor Total', totais.valorTotal],
        ['Valor Recebido', totais.valorRecebido],
        ['Valor Pendente', totais.valorPendente],
        ['Valor Vencido', totais.valorVencido],
      ],
      { origin: `A${totalRow}` },
    );

    // Cria workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contas a Receber');

    // Adiciona sheet de totais por cliente
    if (totais.totaisPorCliente.length > 0) {
      const clienteData = totais.totaisPorCliente.map((c) => ({
        Cliente: c.pessoaNome,
        'Total Títulos': c.totalTitulos,
        'Valor Total': c.valorTotal,
        'Valor Recebido': c.valorRecebido,
        'Valor Pendente': c.valorPendente,
      }));
      const clienteSheet = XLSX.utils.json_to_sheet(clienteData);
      XLSX.utils.book_append_sheet(workbook, clienteSheet, 'Totais por Cliente');
    }

    // Adiciona sheet de totais por período
    if (totais.totaisPorPeriodo.length > 0) {
      const periodoData = totais.totaisPorPeriodo.map((p) => ({
        Período: p.periodo,
        'Total Títulos': p.totalTitulos,
        'Valor Total': p.valorTotal,
        'Valor Recebido': p.valorRecebido,
        'Valor Pendente': p.valorPendente,
      }));
      const periodoSheet = XLSX.utils.json_to_sheet(periodoData);
      XLSX.utils.book_append_sheet(workbook, periodoSheet, 'Totais por Período');
    }

    // Gera buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Exporta relatório em formato PDF
   */
  async exportarPDF(filtros: RelatorioContasReceberDto): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const { dados, totais } = await this.gerarRelatorio(filtros);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Título
      doc.fontSize(18).text('Relatório de Contas a Receber', { align: 'center' });
      doc.moveDown();

      // Filtros aplicados
      doc.fontSize(10).text('Filtros Aplicados:', { underline: true });
      if (filtros.dataInicio || filtros.dataFim) {
        const periodo = `${filtros.dataInicio || '...'} até ${filtros.dataFim || '...'}`;
        doc.text(`Período (${filtros.tipoPeriodo || 'vencimento'}): ${periodo}`);
      }
      if (filtros.status) {
        doc.text(`Status: ${filtros.status}`);
      }
      doc.moveDown();

      // Totais gerais
      doc.fontSize(12).text('Totais Gerais:', { underline: true });
      doc.fontSize(10);
      doc.text(`Total de Registros: ${totais.totalRegistros}`);
      doc.text(`Valor Total: R$ ${this.formatarMoeda(totais.valorTotal)}`);
      doc.text(`Valor Recebido: R$ ${this.formatarMoeda(totais.valorRecebido)}`);
      doc.text(`Valor Pendente: R$ ${this.formatarMoeda(totais.valorPendente)}`);
      doc.text(`Valor Vencido: R$ ${this.formatarMoeda(totais.valorVencido)}`);
      doc.moveDown();

      // Totais por cliente
      if (totais.totaisPorCliente.length > 0) {
        doc.fontSize(12).text('Totais por Cliente:', { underline: true });
        doc.fontSize(9);

        totais.totaisPorCliente.slice(0, 10).forEach((cliente) => {
          doc.text(
            `${cliente.pessoaNome}: ${cliente.totalTitulos} título(s) - ` +
            `Total: R$ ${this.formatarMoeda(cliente.valorTotal)} - ` +
            `Pendente: R$ ${this.formatarMoeda(cliente.valorPendente)}`,
          );
        });

        if (totais.totaisPorCliente.length > 10) {
          doc.text(`... e mais ${totais.totaisPorCliente.length - 10} cliente(s)`);
        }
        doc.moveDown();
      }

      // Detalhamento (primeiras 50 linhas)
      doc.addPage();
      doc.fontSize(12).text('Detalhamento dos Títulos:', { underline: true });
      doc.fontSize(8);
      doc.moveDown(0.5);

      dados.slice(0, 50).forEach((item, index) => {
        if (index > 0 && index % 15 === 0) {
          doc.addPage();
          doc.fontSize(8);
        }

        doc.text(
          `${item.documento}/${item.serie} - Parc. ${item.parcela} - ${item.pessoaNome}`,
          { continued: false },
        );
        doc.text(
          `  Venc: ${this.formatarData(item.vencimento)} - ` +
          `Total: R$ ${this.formatarMoeda(item.valorTotal)} - ` +
          `Saldo: R$ ${this.formatarMoeda(item.saldo)} - ` +
          `Status: ${item.status}`,
        );
        doc.moveDown(0.3);
      });

      if (dados.length > 50) {
        doc.text(`... e mais ${dados.length - 50} título(s)`);
      }

      // Rodapé
      doc.fontSize(8).text(
        `Relatório gerado em ${this.formatarDataHora(new Date())}`,
        50,
        doc.page.height - 50,
        { align: 'center' },
      );

      doc.end();
    });
  }

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  private formatarData(data: Date): string {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  /**
   * Formata data e hora para exibição (DD/MM/YYYY HH:MM:SS)
   */
  private formatarDataHora(data: Date): string {
    const d = new Date(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    const segundo = String(d.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  }

  /**
   * Formata valor monetário
   */
  private formatarMoeda(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }
}
