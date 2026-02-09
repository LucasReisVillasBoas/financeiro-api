import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { EmpresaGuard } from '../auth/empresa.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentClienteIds } from '../auth/decorators/current-empresa.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  sanitizeEmpresaResponse,
  sanitizeEmpresasResponse,
} from '../utils/empresa.util';

@ApiTags('Empresas')
@Controller('empresas')
export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar empresa' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Empresa criada' })
  async create(@Body() dto: CreateEmpresaDto) {
    const data = await this.service.create(dto);
    return { message: 'Empresa criada', statusCode: HttpStatus.CREATED, data };
  }

  /**
   * Endpoint para verificar se o usuário tem empresas (para fluxo de onboarding)
   * Não requer permissões - apenas autenticação
   * Usuário só pode verificar suas próprias empresas
   */
  @Get('minhas-empresas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verificar minhas empresas (onboarding)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresas do usuário' })
  async findMinhasEmpresas(@CurrentUser() user: any) {
    const userId = user.sub || user.id;
    const empresas = await this.service.findByUsuarioId(userId);
    return {
      message: 'Empresas encontradas',
      statusCode: HttpStatus.OK,
      data: {
        hasEmpresas: empresas.length > 0,
        empresas: sanitizeEmpresasResponse(empresas),
      },
    };
  }

  @Get('cliente/:clienteId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'listar' }, { module: 'empresas', action: 'visualizar' })
  @ApiOperation({ summary: 'Listar empresas por cliente' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresas encontradas' })
  async findByCliente(
    @Param('clienteId') clienteId: string,
    @CurrentClienteIds() userClienteIds: string[],
  ) {
    if (!userClienteIds.includes(clienteId)) {
      const empresasAssociadas = await this.service.findByUsuarioId(clienteId);

      return {
        message: 'Empresas encontradas',
        statusCode: HttpStatus.OK,
        data: sanitizeEmpresasResponse(empresasAssociadas),
      };
    }

    const data = await this.service.findAllByCliente(clienteId);
    return {
      message: 'Empresas encontradas',
      statusCode: HttpStatus.OK,
      data: sanitizeEmpresasResponse(data),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'listar' }, { module: 'empresas', action: 'visualizar' })
  @ApiOperation({ summary: 'Obter empresa por id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa encontrada' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return {
      message: 'Empresa encontrada',
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  @Get('/document/:cnpj')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'listar' }, { module: 'empresas', action: 'visualizar' })
  @ApiOperation({ summary: 'Obter empresa por cnpj' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa encontrada' })
  async findByDocument(@Param('cnpj') cnpj: string) {
    const data = await this.service.findByDocument(cnpj);
    return {
      message: 'Empresa encontrada',
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ module: 'empresas', action: 'editar' })
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa atualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    const data = await this.service.update(id, dto);
    return {
      message: 'Empresa atualizada',
      statusCode: HttpStatus.OK,
      data: sanitizeEmpresaResponse(data),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'excluir' })
  @ApiOperation({ summary: 'Remover (soft) empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa removida' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.softDelete(id, user);
    return { message: 'Empresa deletada', statusCode: HttpStatus.OK };
  }

  @Post(':id/filiais')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions({ module: 'empresas', action: 'criar' })
  @ApiOperation({ summary: 'Criar filial para empresa (com contato opcional)' })
  @ApiResponse({ status: 201, description: 'Filial criada' })
  async createFilial(
    @Param('id') id: string,
    @Body() dto: CreateFilialDto,
    @CurrentUser() user: any,
  ) {
    if (dto.empresa_id !== id) dto.empresa_id = id;
    const result = await this.service.createFilial(dto, user.sub || user.id);
    return {
      message: 'Filial criada',
      statusCode: HttpStatus.CREATED,
      data: {
        filial: sanitizeEmpresaResponse(result.filial),
        contato: result.contato || null,
      },
    };
  }

  @Get(':id/filiais')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'listar' }, { module: 'empresas', action: 'visualizar' })
  @ApiOperation({ summary: 'Listar filiais por empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Filiais encontradas' })
  async listFiliais(@Param('id') id: string) {
    const data = await this.service.findFiliaisBySede(id);
    return {
      message: 'Filiais encontradas',
      statusCode: HttpStatus.OK,
      data: sanitizeEmpresasResponse(data),
    };
  }

  @Put('filiais/:filialId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'editar' })
  @ApiOperation({ summary: 'Atualizar filial' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Filial atualizada' })
  async updateFilial(
    @Param('filialId') filialId: string,
    @Body() dto: UpdateFilialDto,
  ) {
    const data = await this.service.updateFilial(filialId, dto);
    return {
      message: 'Filial atualizada',
      statusCode: HttpStatus.OK,
      data: sanitizeEmpresaResponse(data),
    };
  }

  @Delete('filiais/:filialId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, EmpresaGuard)
  @Permissions({ module: 'empresas', action: 'excluir' })
  @ApiOperation({ summary: 'Remover (soft) filial' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Filial removida' })
  async removeFilial(
    @Param('filialId') filialId: string,
    @CurrentUser() user: any,
  ) {
    await this.service.softDeleteFilial(filialId, user);
    return { message: 'Filial deletada', statusCode: HttpStatus.OK };
  }
}
