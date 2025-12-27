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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContasBancariasService } from './conta-bancaria.service';
import { CreateContaBancariaDto } from './dto/create-conta-bancaria.dto';
import { UpdateContaBancariaDto } from './dto/update-conta-bancaria.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@ApiTags('Contas Bancárias')
@ApiBearerAuth()
@Controller('contas-bancarias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContaBancariaController {
  constructor(
    private readonly contasBancariasService: ContasBancariasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ module: 'financeiro', action: 'criar' })
  @ApiOperation({
    summary: 'Criar nova conta bancária',
    description:
      'Cria uma nova conta bancária. Requer permissão financeiro:criar.',
  })
  async create(@Body() dto: CreateContaBancariaDto) {
    const conta = await this.contasBancariasService.create(dto);
    return {
      message: 'Conta bancária criada com sucesso',
      statusCode: HttpStatus.CREATED,
      data: conta,
    };
  }

  @Get()
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  @ApiOperation({
    summary: 'Listar todas as contas bancárias',
    description:
      'Lista todas as contas bancárias. Requer permissão financeiro:listar ou financeiro:visualizar.',
  })
  async findAll() {
    const contas = await this.contasBancariasService.findAll();
    return {
      message: 'Contas bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get('empresa/:empresaId')
  @Permissions({ module: 'financeiro', action: 'listar' }, { module: 'financeiro', action: 'visualizar' })
  @ApiOperation({
    summary: 'Listar contas bancárias por empresa',
    description: 'Lista contas bancárias de uma empresa específica.',
  })
  async findByEmpresa(@Param('empresaId') empresaId: string) {
    const contas = await this.contasBancariasService.findByEmpresa(empresaId);
    return {
      message: 'Contas bancárias encontradas',
      statusCode: HttpStatus.OK,
      data: contas,
    };
  }

  @Get(':id')
  @Permissions({ module: 'financeiro', action: 'visualizar' })
  @ApiOperation({
    summary: 'Buscar conta bancária por ID',
    description: 'Retorna uma conta bancária específica.',
  })
  async findOne(@Param('id') id: string) {
    const conta = await this.contasBancariasService.findOne(id);
    return {
      message: 'Conta bancária encontrada',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Put(':id')
  @Permissions({ module: 'financeiro', action: 'editar' })
  @ApiOperation({
    summary: 'Atualizar conta bancária',
    description:
      'Atualiza os dados de uma conta bancária. Requer permissão financeiro:editar.',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateContaBancariaDto) {
    const conta = await this.contasBancariasService.update(id, dto);
    return {
      message: 'Conta bancária atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: conta,
    };
  }

  @Patch(':id/toggle-status')
  @Permissions({ module: 'financeiro', action: 'editar' })
  @ApiOperation({
    summary: 'Ativar/Inativar conta bancária',
    description:
      'Altera o status ativo/inativo de uma conta bancária. Requer permissão financeiro:editar. Operação auditada.',
  })
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
  @Permissions({ module: 'financeiro', action: 'excluir' })
  @ApiOperation({
    summary: 'Excluir conta bancária (soft delete)',
    description:
      'Exclui logicamente uma conta bancária. Requer permissão financeiro:excluir. Operação auditada como CRÍTICA.',
  })
  async delete(@Param('id') id: string) {
    await this.contasBancariasService.softDelete(id);
    return {
      message: 'Conta bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
