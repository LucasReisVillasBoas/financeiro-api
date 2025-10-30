import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  SetMetadata,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { RolesGuard } from '../auth/roles.guard';
import { EmpresaGuard } from '../auth/empresa.guard';
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

  @Get('cliente/:clienteId')
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador', 'Editor'])
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
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Remover (soft) empresa' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Empresa removida' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.service.softDelete(id, user);
    return { message: 'Empresa deletada', statusCode: HttpStatus.OK };
  }

  @Post(':id/filiais')
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Criar filial para empresa' })
  @ApiResponse({ status: 201, description: 'Filial criada' })
  async createFilial(@Param('id') id: string, @Body() dto: CreateFilialDto) {
    if (dto.empresa_id !== id) dto.empresa_id = id;
    const data = await this.service.createFilial(dto);
    return {
      message: 'Filial criada',
      statusCode: HttpStatus.CREATED,
      data: sanitizeEmpresaResponse(data),
    };
  }

  @Get(':id/filiais')
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor'])
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
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador'])
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
