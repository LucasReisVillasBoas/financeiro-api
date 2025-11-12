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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Contas Bancárias')
@ApiBearerAuth()
@Controller('contas-bancarias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContaBancariaController {
  constructor(
    private readonly contasBancariasService: ContasBancariasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Administrador', 'Financeiro')
  @ApiOperation({
    summary: 'Criar nova conta bancária',
    description:
      'Cria uma nova conta bancária. Requer perfil Administrador ou Financeiro.',
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
  @Roles('Administrador', 'Financeiro', 'Visualizador')
  @ApiOperation({
    summary: 'Listar todas as contas bancárias',
    description:
      'Lista todas as contas bancárias. Requer perfil Administrador, Financeiro ou Visualizador.',
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
  @Roles('Administrador', 'Financeiro', 'Visualizador')
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
  @Roles('Administrador', 'Financeiro', 'Visualizador')
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
  @Roles('Administrador', 'Financeiro')
  @ApiOperation({
    summary: 'Atualizar conta bancária',
    description:
      'Atualiza os dados de uma conta bancária. Requer perfil Administrador ou Financeiro.',
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
  @Roles('Administrador', 'Financeiro')
  @ApiOperation({
    summary: 'Ativar/Inativar conta bancária',
    description:
      'Altera o status ativo/inativo de uma conta bancária. Requer perfil Administrador ou Financeiro. Operação auditada.',
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
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Excluir conta bancária (soft delete)',
    description:
      'Exclui logicamente uma conta bancária. Requer perfil Administrador. Operação auditada como CRÍTICA.',
  })
  async delete(@Param('id') id: string) {
    await this.contasBancariasService.softDelete(id);
    return {
      message: 'Conta bancária excluída com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
