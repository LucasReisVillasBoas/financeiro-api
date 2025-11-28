import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ContasReceberService } from './conta-receber.service';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';
import { CreateContaReceberParceladaDto } from './dto/create-conta-receber-parcelada.dto';
import { CancelarContaReceberDto } from './dto/cancelar-conta-receber.dto';
import { Request } from 'express';

@Controller('contas-receber')
export class ContasReceberController {
  constructor(private readonly contaReceberService: ContasReceberService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContaReceberDto, @Req() req: Request) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const userEmail = (req as any).user?.email || 'desconhecido@system.com';

    const conta = await this.contaReceberService.create(dto, userId, userEmail);
    return {
      message: 'Conta a receber criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: conta,
    };
  }

  @Get()
  async findAll() {
    const contas = await this.contaReceberService.findAll();
    return {
      message: 'Contas a receber encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.contaReceberService.findByEmpresa(empresaId);
    return {
      message: 'Contas a receber encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const conta = await this.contaReceberService.findOne(id);
    return {
      message: 'Conta a receber encontrada',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContaReceberDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const userEmail = (req as any).user?.email || 'desconhecido@system.com';

    const conta = await this.contaReceberService.update(id, dto, userId, userEmail);
    return {
      message: 'Conta a receber atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/liquidar')
  async liquidar(
    @Param('id') id: string,
    @Body() body: { valorRecebido: number; dataLiquidacao?: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    const userEmail = (req as any).user?.email || 'desconhecido@system.com';

    const dataLiquidacao = body.dataLiquidacao
      ? new Date(body.dataLiquidacao)
      : undefined;
    const conta = await this.contaReceberService.liquidar(
      id,
      body.valorRecebido,
      dataLiquidacao,
      userId,
      userEmail,
    );
    return {
      message: 'Conta liquidada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Post('parcelado')
  @HttpCode(HttpStatus.CREATED)
  async createParcelado(
    @Body() dto: CreateContaReceberParceladaDto,
    @Req() req: Request,
  ) {
    const usuarioId = (req as any).user?.id;
    const parcelas = await this.contaReceberService.createParcelado(
      dto,
      usuarioId,
    );
    return {
      message: `${parcelas.length} parcelas criadas com sucesso`,
      statusCode: HttpStatus.CREATED,
      data: parcelas,
    };
  }

  @Patch(':id/cancelar')
  async cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarContaReceberDto,
    @Req() req: Request,
  ) {
    const usuarioId = (req as any).user?.id;
    const conta = await this.contaReceberService.cancelar(id, dto, usuarioId);
    return {
      message: 'Conta cancelada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.contaReceberService.softDelete(id);
    return {
      message: 'Conta a receber excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
