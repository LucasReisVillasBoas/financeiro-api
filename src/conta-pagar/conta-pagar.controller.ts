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
} from '@nestjs/common';
import { ContasPagarService } from './conta-pagar.service';
import { CreateContaPagarDto } from './dto/create-conta-pagar.dto';
import { UpdateContaPagarDto } from './dto/update-conta-pagar.dto';

@Controller('contas-pagar')
export class ContasPagarController {
  constructor(private readonly contaPagarService: ContasPagarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContaPagarDto) {
    const conta = await this.contaPagarService.create(dto);
    return {
      message: 'Conta a pagar criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: conta,
    };
  }

  @Get()
  async findAll() {
    const contas = await this.contaPagarService.findAll();
    return {
      message: 'Contas a pagar encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.contaPagarService.findByEmpresa(empresaId);
    return {
      message: 'Contas a pagar encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const conta = await this.contaPagarService.findOne(id);
    return {
      message: 'Conta a pagar encontrada',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContaPagarDto) {
    const conta = await this.contaPagarService.update(id, dto);
    return {
      message: 'Conta a pagar atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/pagar')
  async marcarComoPaga(@Param('id') id: string) {
    const conta = await this.contaPagarService.marcarComoPaga(id);
    return {
      message: 'Conta marcada como paga com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.contaPagarService.softDelete(id);
    return {
      message: 'Conta a pagar excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
