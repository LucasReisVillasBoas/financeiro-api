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
import { ContaReceberService } from './conta-receber.service';
import { CreateContaReceberDto } from './dto/create-conta-receber.dto';
import { UpdateContaReceberDto } from './dto/update-conta-receber.dto';

@Controller('contas-receber')
export class ContaReceberController {
  constructor(private readonly contaReceberService: ContaReceberService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContaReceberDto) {
    const conta = await this.contaReceberService.create(dto);
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
  async update(@Param('id') id: string, @Body() dto: UpdateContaReceberDto) {
    const conta = await this.contaReceberService.update(id, dto);
    return {
      message: 'Conta a receber atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/receber')
  async marcarComoRecebida(@Param('id') id: string) {
    const conta = await this.contaReceberService.marcarComoRecebida(id);
    return {
      message: 'Conta marcada como recebida com sucesso',
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
