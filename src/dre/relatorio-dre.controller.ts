import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DreService } from './dre.service';
import { RelatorioDreFiltrosDto } from './dto/relatorio-dre.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('relatorios/dre')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RelatorioDreController {
  constructor(private readonly dreService: DreService) {}

  /**
   * GET /relatorios/dre
   * Retorna relatório DRE no formato esperado pelo frontend
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions({ module: 'relatorios', action: 'visualizar' })
  async gerarRelatorio(@Query() filtros: RelatorioDreFiltrosDto) {
    const resultado = await this.dreService.gerarRelatorioDre(filtros);
    return {
      message: 'Relatório DRE gerado com sucesso',
      statusCode: HttpStatus.OK,
      data: resultado,
    };
  }
}
