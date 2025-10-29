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
import { ContasBancariasService } from './conta-bancaria.service';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';

@Controller('contas-bancarias')
export class ContaBancariaController {
  constructor(
    private readonly contasBancariasService: ContasBancariasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContaBancariaDto) {
    const conta = await this.contasBancariasService.create(dto);
    return {
      message: 'Conta bancária criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: conta,
    };
  }

  @Get()
  async findAll() {
    const contas = await this.contasBancariasService.findAll();
    return {
      message: 'Contas bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.contasBancariasService.findByEmpresa(empresaId);
    return {
      message: 'Contas bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const conta = await this.contasBancariasService.findOne(id);
    return {
      message: 'Conta bancária encontrada',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContaBancariaDto) {
    const conta = await this.contasBancariasService.update(id, dto);
    return {
      message: 'Conta bancária atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const conta = await this.contasBancariasService.toggleStatus(id);
    return {
      message: 'Status da conta alterado com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.contasBancariasService.softDelete(id);
    return {
      message: 'Conta bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
