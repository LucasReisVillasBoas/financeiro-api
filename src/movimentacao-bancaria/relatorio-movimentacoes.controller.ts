import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Response,
  StreamableFile,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { RelatorioMovimentacoesService } from './relatorio-movimentacoes.service';
import {
  FiltroRelatorioMovimentacoesDto,
  FormatoExportacao,
} from './dto/filtro-relatorio-movimentacoes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { EmpresaGuard } from '../auth/empresa.guard';

@Controller('movimentacoes-bancarias/relatorio')
@UseGuards(JwtAuthGuard, RolesGuard, EmpresaGuard)
export class RelatorioMovimentacoesController {
  constructor(
    private readonly relatorioService: RelatorioMovimentacoesService,
  ) {}

  @Get()
  async gerarRelatorio(@Query() filtros: FiltroRelatorioMovimentacoesDto) {
    const relatorio = await this.relatorioService.gerarRelatorio(filtros);
    return {
      message: 'Relatório gerado com sucesso',
      statusCode: HttpStatus.OK,
      data: relatorio,
    };
  }

  @Get('exportar')
  async exportar(
    @Query() filtros: FiltroRelatorioMovimentacoesDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const formato = filtros.formato || FormatoExportacao.CSV;

    switch (formato) {
      case FormatoExportacao.CSV:
        const csv = await this.relatorioService.exportarCSV(filtros);
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}.csv"`,
        });
        return csv;

      case FormatoExportacao.EXCEL:
        const excel = await this.relatorioService.exportarExcel(filtros);
        res.set({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}.xlsx"`,
        });
        return new StreamableFile(excel);

      case FormatoExportacao.PDF:
        const pdf = await this.relatorioService.exportarPDF(filtros);
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}.pdf"`,
        });
        return new StreamableFile(pdf);

      default:
        const defaultCsv = await this.relatorioService.exportarCSV(filtros);
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio-movimentacoes-${new Date().toISOString().split('T')[0]}.csv"`,
        });
        return defaultCsv;
    }
  }
}
