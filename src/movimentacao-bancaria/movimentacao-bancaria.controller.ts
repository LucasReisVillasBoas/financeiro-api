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
} from '@nestjs/common';
import { MovimentacoesBancariasService } from './movimentacao-bancaria.service';
import { CreateMovimentacoesBancariasDto } from './dto/create-movimentacao-bancaria.dto';
import { UpdateMovimentacoesBancariasDto } from './dto/update-movimentacao-bancaria.dto';

@Controller('movimentacoes-bancarias')
export class MovimentacoesBancariasController {
  constructor(
    private readonly movimentacaoService: MovimentacoesBancariasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMovimentacoesBancariasDto) {
    const movimentacao = await this.movimentacaoService.create(dto);
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
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.movimentacaoService.softDelete(id);
    return {
      message: 'Movimentação bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
