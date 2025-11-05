import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RelatorioContasPagarService } from './relatorio-contas-pagar.service';
import { ExportacaoContasPagarService } from './exportacao-contas-pagar.service';
import { FiltroRelatorioContasPagarDto } from './dto/filtro-relatorio-contas-pagar.dto';

@Controller('relatorios/contas-pagar')
export class RelatorioContasPagarController {
  constructor(
    private readonly relatorioService: RelatorioContasPagarService,
    private readonly exportacaoService: ExportacaoContasPagarService,
  ) {}

  @Get()
  async gerarRelatorio(@Query() filtro: FiltroRelatorioContasPagarDto) {
    const relatorio = await this.relatorioService.gerarRelatorio(filtro);

    return {
      message: 'Relatório gerado com sucesso',
      statusCode: HttpStatus.OK,
      data: relatorio,
    };
  }

  @Get('exportar/csv')
  async exportarCSV(@Query() filtro: FiltroRelatorioContasPagarDto, @Res() res: Response) {
    const relatorio = await this.relatorioService.gerarRelatorio(filtro);
    const buffer = await this.exportacaoService.exportarCSV(relatorio);

    const nomeArquivo = `contas_pagar_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  }

  @Get('exportar/excel')
  async exportarExcel(@Query() filtro: FiltroRelatorioContasPagarDto, @Res() res: Response) {
    const relatorio = await this.relatorioService.gerarRelatorio(filtro);
    const buffer = await this.exportacaoService.exportarExcel(relatorio);

    const nomeArquivo = `contas_pagar_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  }

  @Get('exportar/pdf')
  async exportarPDF(@Query() filtro: FiltroRelatorioContasPagarDto, @Res() res: Response) {
    const relatorio = await this.relatorioService.gerarRelatorio(filtro);
    const buffer = await this.exportacaoService.exportarPDF(relatorio);

    const nomeArquivo = `contas_pagar_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  }
}
