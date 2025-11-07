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
import { RolesGuard } from '../auth/roles.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('movimentacoes-bancarias')
@UseGuards(JwtAuthGuard, RolesGuard, EmpresaGuard)
export class MovimentacoesBancariasController {
  constructor(
    private readonly movimentacaoService: MovimentacoesBancariasService,
  ) {}

  @Post()
  @Roles('Administrador', 'Financeiro')
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
  async findAll() {
    const movimentacoes = await this.movimentacaoService.findAll();
    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoes,
    };
  }

  @Get('periodo')
  async findByPeriodo(
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    const movimentacoes = await this.movimentacaoService.findByPeriodo(
      dataInicio,
      dataFim,
    );
    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoes,
    };
  }

  @Get('conta/:contaId')
  async findByConta(@Param('contaId') contaId: string) {
    const movimentacoes = await this.movimentacaoService.findByConta(contaId);
    return {
      message: 'Movimentações bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: movimentacoes,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const movimentacao = await this.movimentacaoService.findOne(id);
    return {
      message: 'Movimentação bancária encontrada',
      statusCode: HttpStatus.OK,
      data: movimentacao,
    };
  }

  @Put(':id')
  @Roles('ADMIN', 'FINANCEIRO', 'TESOUREIRO')
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
  @Roles('ADMIN', 'FINANCEIRO')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.movimentacaoService.softDelete(id);
    return {
      message: 'Movimentação bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('conciliar')
  @Roles('Administrador', 'Financeiro')
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
  @Roles('Administrador', 'Financeiro')
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
