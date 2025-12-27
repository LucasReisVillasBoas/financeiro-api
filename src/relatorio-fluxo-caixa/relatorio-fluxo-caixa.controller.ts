import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RelatorioFluxoCaixaService } from './relatorio-fluxo-caixa.service';
import { FluxoCaixaFiltrosDto } from './dto/fluxo-caixa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('relatorios/fluxo-caixa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RelatorioFluxoCaixaController {
  constructor(
    private readonly relatorioFluxoCaixaService: RelatorioFluxoCaixaService,
  ) {}

  /**
   * GET /relatorios/fluxo-caixa
   * Retorna relatório de fluxo de caixa com filtros aplicados
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'visualizar' })
  async gerarRelatorio(@Query() filtros: FluxoCaixaFiltrosDto) {
    const resultado =
      await this.relatorioFluxoCaixaService.gerarRelatorio(filtros);
    return {
      message: 'Relatório de fluxo de caixa gerado com sucesso',
      statusCode: HttpStatus.OK,
      data: resultado,
    };
  }
}
