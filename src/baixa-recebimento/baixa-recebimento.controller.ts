import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BaixaRecebimentoService } from './baixa-recebimento.service';
import { CreateBaixaRecebimentoDto } from './dto/create-baixa-recebimento.dto';
import { Request } from 'express';

@Controller('baixas-recebimento')
export class BaixaRecebimentoController {
  constructor(
    private readonly baixaRecebimentoService: BaixaRecebimentoService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBaixaRecebimentoDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const userId = user?.id || 'system';
    const userEmail = user?.email || 'system@system.com';

    const baixa = await this.baixaRecebimentoService.create(
      dto,
      userId,
      userEmail,
    );

    return {
      message: 'Baixa de recebimento registrada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: baixa,
    };
  }

  @Get()
  async findAll() {
    const baixas = await this.baixaRecebimentoService.findAll();
    return {
      message: 'Baixas de recebimento encontradas',
      statusCode: HttpStatus.OK,
      data: baixas,
    };
  }

  @Get('conta-receber/:contaReceberId')
  async findByContaReceber(@Param('contaReceberId') contaReceberId: string) {
    const baixas = await this.baixaRecebimentoService.findByContaReceber(
      contaReceberId,
    );
    return {
      message: 'Baixas da conta a receber encontradas',
      statusCode: HttpStatus.OK,
      data: baixas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const baixa = await this.baixaRecebimentoService.findOne(id);
    return {
      message: 'Baixa de recebimento encontrada',
      statusCode: HttpStatus.OK,
      data: baixa,
    };
  }

  @Get(':id/movimentacao')
  async findMovimentacao(@Param('id') id: string) {
    const movimentacao = await this.baixaRecebimentoService.findMovimentacaoBancaria(id);
    return {
      message: movimentacao
        ? 'Movimentação bancária encontrada'
        : 'Nenhuma movimentação bancária vinculada',
      statusCode: HttpStatus.OK,
      data: movimentacao,
    };
  }

  @Delete(':id/estornar')
  @HttpCode(HttpStatus.OK)
  async estornar(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    const userId = user?.id || 'system';
    const userEmail = user?.email || 'system@system.com';

    const baixa = await this.baixaRecebimentoService.estornar(
      id,
      userId,
      userEmail,
    );

    return {
      message: 'Baixa estornada com sucesso',
      statusCode: HttpStatus.OK,
      data: baixa,
    };
  }
}
