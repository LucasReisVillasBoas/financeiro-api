import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { RelatorioContasReceberService } from './relatorio-contas-receber.service';
import { RelatorioContasReceberDto } from './dto/relatorio-contas-receber.dto';

@Controller('relatorios/contas-receber')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RelatorioContasReceberController {
  constructor(
    private readonly relatorioService: RelatorioContasReceberService,
  ) {}

  /**
   * GET /relatorios/contas-receber
   * Retorna relatório em formato JSON com filtros aplicados
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'visualizar' })
  async gerarRelatorio(@Query() filtros: RelatorioContasReceberDto) {
    const resultado = await this.relatorioService.gerarRelatorio(filtros);
    return {
      message: 'Relatório gerado com sucesso',
      statusCode: HttpStatus.OK,
      ...resultado,
    };
  }

  /**
   * GET /relatorios/contas-receber/exportar/csv
   * Exporta relatório em formato CSV
   */
  @Get('exportar/csv')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'exportar' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="relatorio-contas-receber.csv"')
  async exportarCSV(
    @Query() filtros: RelatorioContasReceberDto,
    @Res() res: Response,
  ) {
    const csv = await this.relatorioService.exportarCSV(filtros);
    res.send(csv);
  }

  /**
   * GET /relatorios/contas-receber/exportar/excel
   * Exporta relatório em formato Excel (XLSX)
   */
  @Get('exportar/excel')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'exportar' })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="relatorio-contas-receber.xlsx"')
  async exportarExcel(
    @Query() filtros: RelatorioContasReceberDto,
    @Res() res: Response,
  ) {
    const buffer = await this.relatorioService.exportarExcel(filtros);
    res.send(buffer);
  }

  /**
   * GET /relatorios/contas-receber/exportar/pdf
   * Exporta relatório em formato PDF
   */
  @Get('exportar/pdf')
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'exportar' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="relatorio-contas-receber.pdf"')
  async exportarPDF(
    @Query() filtros: RelatorioContasReceberDto,
    @Res() res: Response,
  ) {
    const buffer = await this.relatorioService.exportarPDF(filtros);
    res.send(buffer);
  }
}
