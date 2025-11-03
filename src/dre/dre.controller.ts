import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DreService } from './dre.service';
import { FilterDreDto } from './dto/filter-dre.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('dre')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DreController {
  constructor(private readonly dreService: DreService) {}

  @Get()
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async gerarDre(@Query() filtro: FilterDreDto) {
    if (!filtro.empresaId || !filtro.dataInicio || !filtro.dataFim) {
      throw new BadRequestException(
        'empresaId, dataInicio e dataFim são obrigatórios',
      );
    }

    const dre = await this.dreService.gerarDre(filtro);

    return {
      message: 'DRE gerado com sucesso',
      statusCode: 200,
      data: dre,
    };
  }

  @Get('consolidado')
  @Roles('Administrador', 'Financeiro', 'Contador')
  async gerarDreConsolidado(
    @Query('empresaIds') empresaIds: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    if (!empresaIds || !dataInicio || !dataFim) {
      throw new BadRequestException(
        'empresaIds, dataInicio e dataFim são obrigatórios',
      );
    }

    const empresaIdsArray = empresaIds.split(',');

    const dreConsolidado = await this.dreService.gerarDreConsolidado(
      empresaIdsArray,
      dataInicio,
      dataFim,
    );

    return {
      message: 'DRE consolidado gerado com sucesso',
      statusCode: 200,
      data: dreConsolidado,
    };
  }

  @Get('comparativo')
  @Roles('Administrador', 'Financeiro', 'Contador', 'Visualizador')
  async gerarComparativo(
    @Query('empresaId') empresaId: string,
    @Query('periodo1Inicio') periodo1Inicio: string,
    @Query('periodo1Fim') periodo1Fim: string,
    @Query('periodo2Inicio') periodo2Inicio: string,
    @Query('periodo2Fim') periodo2Fim: string,
  ) {
    if (
      !empresaId ||
      !periodo1Inicio ||
      !periodo1Fim ||
      !periodo2Inicio ||
      !periodo2Fim
    ) {
      throw new BadRequestException('Todos os parâmetros são obrigatórios');
    }

    const comparativo = await this.dreService.gerarComparativo(
      empresaId,
      periodo1Inicio,
      periodo1Fim,
      periodo2Inicio,
      periodo2Fim,
    );

    return {
      message: 'Comparativo gerado com sucesso',
      statusCode: 200,
      data: comparativo,
    };
  }
}
