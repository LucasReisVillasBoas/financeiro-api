import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateFilialDto } from './dto/create-filial.dto';
import { UpdateFilialDto } from './dto/update-filial.dto';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Empresas')
@Controller('empresas')
@UseGuards(RolesGuard)
export class EmpresaController {
  constructor(private readonly service: EmpresaService) {}

  @Post()
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Criar empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada' })
  async create(@Body() dto: CreateEmpresaDto) {
    const data = await this.service.create(dto);
    return { message: 'Empresa criada', statusCode: 201, data };
  }

  @Get('cliente/:clienteId')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  @ApiOperation({ summary: 'Listar empresas por cliente' })
  @ApiResponse({ status: 200, description: 'Empresas encontradas' })
  async findByCliente(@Param('clienteId') clienteId: string) {
    const data = await this.service.findAllByCliente(clienteId);
    return { message: 'Empresas encontradas', statusCode: 200, data };
  }

  @Get(':id')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  @ApiOperation({ summary: 'Obter empresa por id' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { message: 'Empresa encontrada', statusCode: 200, data };
  }

  @Put(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    const data = await this.service.update(id, dto);
    return { message: 'Empresa atualizada', statusCode: 200, data };
  }

  @Delete(':id')
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Remover (soft) empresa' })
  @ApiResponse({ status: 200, description: 'Empresa removida' })
  async remove(@Param('id') id: string) {
    await this.service.softDelete(id);
    return { message: 'Empresa deletada', statusCode: 200 };
  }

  /* Filiais */

  @Post(':id/filiais')
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Criar filial para empresa' })
  @ApiResponse({ status: 201, description: 'Filial criada' })
  async createFilial(@Param('id') id: string, @Body() dto: CreateFilialDto) {
    // garante que empresa_id corresponde ao path param
    if (dto.empresa_id !== id) dto.empresa_id = id;
    const data = await this.service.createFilial(dto);
    return { message: 'Filial criada', statusCode: 201, data };
  }

  @Get(':id/filiais')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  @ApiOperation({ summary: 'Listar filiais por empresa' })
  @ApiResponse({ status: 200, description: 'Filiais encontradas' })
  async listFiliais(@Param('id') id: string) {
    const data = await this.service.findFiliaisBySede(id);
    return { message: 'Filiais encontradas', statusCode: 200, data };
  }

  @Put('filiais/:filialId')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  @ApiOperation({ summary: 'Atualizar filial' })
  @ApiResponse({ status: 200, description: 'Filial atualizada' })
  async updateFilial(
    @Param('filialId', ParseIntPipe) filialId: string,
    @Body() dto: UpdateFilialDto,
  ) {
    const data = await this.service.updateFilial(filialId, dto);
    return { message: 'Filial atualizada', statusCode: 200, data };
  }

  @Delete('filiais/:filialId')
  @SetMetadata('roles', ['Administrador'])
  @ApiOperation({ summary: 'Remover (soft) filial' })
  @ApiResponse({ status: 200, description: 'Filial removida' })
  async removeFilial(@Param('filialId', ParseIntPipe) filialId: string) {
    await this.service.softDeleteFilial(filialId);
    return { message: 'Filial deletada', statusCode: 200 };
  }
}
