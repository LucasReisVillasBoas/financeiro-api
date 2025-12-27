import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MovimentacoesBancariasService } from './movimentacao-bancaria.service';
import { CreateMovimentacoesBancariasDto } from './dto/create-movimentacao-bancaria.dto';
import { UpdateMovimentacoesBancariasDto } from './dto/update-movimentacao-bancaria.dto';
import { ConciliarMovimentacoesDto } from './dto/conciliar-movimentacoes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { EmpresaGuard } from '../auth/empresa.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('movimentacoes-bancarias')
@UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
export class MovimentacoesBancariasController {
  constructor(
    private readonly movimentacaoService: MovimentacoesBancariasService,
  ) {}

  @Post()
  @Permissions({ module: 'financeiro', action: 'criar' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMovimentacoesBancariasDto,
    @CurrentUser() user: any,
  ) {
    const movimentacao = await this.movimentacaoService.create(
      dto,
      user?.id,
      user?.email,
    );
    return {
      message: 'Movimentação bancária criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: movimentacao,
    };
  }

  @Get()
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  async findAll() {
    const movimentacoes = await this.movimentacaoService.findAll();

    // Calcular totais
    let totalEntradas = 0;
    let totalSaidas = 0;

    movimentacoes.forEach((mov) => {
      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';

      if (isEntrada) {
        totalEntradas += mov.valor;
      } else {
        totalSaidas += mov.valor;
      }
    });

    const saldoPeriodo = totalEntradas - totalSaidas;

    // Serializar datas corretamente
    const movimentacoesSerializadas = movimentacoes.map((mov) => ({
      ...mov,
      dataMovimento: mov.dataMovimento?.toISOString
        ? mov.dataMovimento.toISOString()
        : mov.dataMovimento,
      conciliadoEm: mov.conciliadoEm?.toISOString
        ? mov.conciliadoEm.toISOString()
        : mov.conciliadoEm,
      criadoEm: mov.criadoEm?.toISOString
        ? mov.criadoEm.toISOString()
        : mov.criadoEm,
      atualizadoEm: mov.atualizadoEm?.toISOString
        ? mov.atualizadoEm.toISOString()
        : mov.atualizadoEm,
      deletadoEm: mov.deletadoEm?.toISOString
        ? mov.deletadoEm.toISOString()
        : mov.deletadoEm,
    }));

    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoesSerializadas,
      resumo: {
        totalEntradas,
        totalSaidas,
        saldoPeriodo,
      },
    };
  }

  @Get('periodo')
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  async findByPeriodo(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    const movimentacoes = await this.movimentacaoService.findByPeriodo(
      dataInicio,
      dataFim,
    );

    // Calcular totais
    let totalEntradas = 0;
    let totalSaidas = 0;

    movimentacoes.forEach((mov) => {
      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';

      if (isEntrada) {
        totalEntradas += mov.valor;
      } else {
        totalSaidas += mov.valor;
      }
    });

    const saldoPeriodo = totalEntradas - totalSaidas;

    // Serializar datas corretamente
    const movimentacoesSerializadas = movimentacoes.map((mov) => ({
      ...mov,
      dataMovimento: mov.dataMovimento?.toISOString
        ? mov.dataMovimento.toISOString()
        : mov.dataMovimento,
      conciliadoEm: mov.conciliadoEm?.toISOString
        ? mov.conciliadoEm.toISOString()
        : mov.conciliadoEm,
      criadoEm: mov.criadoEm?.toISOString
        ? mov.criadoEm.toISOString()
        : mov.criadoEm,
      atualizadoEm: mov.atualizadoEm?.toISOString
        ? mov.atualizadoEm.toISOString()
        : mov.atualizadoEm,
      deletadoEm: mov.deletadoEm?.toISOString
        ? mov.deletadoEm.toISOString()
        : mov.deletadoEm,
    }));

    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoesSerializadas,
      resumo: {
        totalEntradas,
        totalSaidas,
        saldoPeriodo,
      },
    };
  }

  @Get('conta/:contaId')
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  async findByConta(@Param('contaId') contaId: string) {
    const movimentacoes = await this.movimentacaoService.findByConta(contaId);

    // Calcular totais
    let totalEntradas = 0;
    let totalSaidas = 0;

    movimentacoes.forEach((mov) => {
      const isEntrada =
        mov.tipoMovimento === 'Entrada' || mov.tipoMovimento === 'Crédito';

      if (isEntrada) {
        totalEntradas += mov.valor;
      } else {
        totalSaidas += mov.valor;
      }
    });

    const saldoPeriodo = totalEntradas - totalSaidas;

    // Serializar datas corretamente
    const movimentacoesSerializadas = movimentacoes.map((mov) => ({
      ...mov,
      dataMovimento: mov.dataMovimento?.toISOString
        ? mov.dataMovimento.toISOString()
        : mov.dataMovimento,
      conciliadoEm: mov.conciliadoEm?.toISOString
        ? mov.conciliadoEm.toISOString()
        : mov.conciliadoEm,
      criadoEm: mov.criadoEm?.toISOString
        ? mov.criadoEm.toISOString()
        : mov.criadoEm,
      atualizadoEm: mov.atualizadoEm?.toISOString
        ? mov.atualizadoEm.toISOString()
        : mov.atualizadoEm,
      deletadoEm: mov.deletadoEm?.toISOString
        ? mov.deletadoEm.toISOString()
        : mov.deletadoEm,
    }));

    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoesSerializadas,
      resumo: {
        totalEntradas,
        totalSaidas,
        saldoPeriodo,
      },
    };
  }

  @Get(':id')
  @Permissions({ module: 'financeiro', action: 'visualizar' })
  async findOne(@Param('id') id: string) {
    const movimentacao = await this.movimentacaoService.findOne(id);

    // Serializar datas corretamente
    const movimentacaoSerializada = {
      ...movimentacao,
      dataMovimento: movimentacao.dataMovimento?.toISOString
        ? movimentacao.dataMovimento.toISOString()
        : movimentacao.dataMovimento,
      conciliadoEm: movimentacao.conciliadoEm?.toISOString
        ? movimentacao.conciliadoEm.toISOString()
        : movimentacao.conciliadoEm,
      criadoEm: movimentacao.criadoEm?.toISOString
        ? movimentacao.criadoEm.toISOString()
        : movimentacao.criadoEm,
      atualizadoEm: movimentacao.atualizadoEm?.toISOString
        ? movimentacao.atualizadoEm.toISOString()
        : movimentacao.atualizadoEm,
      deletadoEm: movimentacao.deletadoEm?.toISOString
        ? movimentacao.deletadoEm.toISOString()
        : movimentacao.deletadoEm,
    };

    return {
      message: 'Movimentação bancária encontrada',
      statusCode: HttpStatus.OK,
      data: movimentacaoSerializada,
    };
  }

  @Put(':id')
  @Permissions({ module: 'financeiro', action: 'editar' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMovimentacoesBancariasDto,
  ) {
    const movimentacao = await this.movimentacaoService.update(id, dto);
    return {
      message: 'Movimentação bancária atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: movimentacao,
    };
  }

  @Delete(':id')
  @Permissions({ module: 'financeiro', action: 'excluir' })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.movimentacaoService.softDelete(id);
    return {
      message: 'Movimentação bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('conciliar')
  @Permissions({ module: 'financeiro', action: 'editar' })
  @HttpCode(HttpStatus.OK)
  async conciliar(
    @Body() dto: ConciliarMovimentacoesDto,
    @CurrentUser() user: any,
  ) {
    const resultado = await this.movimentacaoService.conciliar(
      dto,
      user?.id,
      user?.email,
    );
    return {
      message: `${resultado.conciliadas} movimentação(ões) conciliada(s) com sucesso`,
      statusCode: HttpStatus.OK,
      data: resultado,
    };
  }

  @Post('desconciliar')
  @Permissions({ module: 'financeiro', action: 'editar' })
  @HttpCode(HttpStatus.OK)
  async desconciliar(
    @Body() dto: ConciliarMovimentacoesDto,
    @CurrentUser() user: any,
  ) {
    const resultado = await this.movimentacaoService.desconciliar(
      dto,
      user?.id,
      user?.email,
    );
    return {
      message: `${resultado.desconciliadas} movimentação(ões) desconciliada(s) com sucesso`,
      statusCode: HttpStatus.OK,
      data: resultado,
    };
  }
}
