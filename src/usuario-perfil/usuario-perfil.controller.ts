import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { UsuarioPerfilService } from './usuario-perfil.service';
import type { UpdateUsuarioPerfilDto } from './dto/update-usuario-perfil.dto';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Usuário-Perfil')
@Controller('usuario-perfil')
export class UsuarioPerfilController {
  constructor(private readonly usuarioPerfilService: UsuarioPerfilService) {}

  @Get()
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  @ApiResponse({ status: 200, description: 'Lista de associações' })
  async findAll() {
    const data = await this.usuarioPerfilService.findAll();
    return { message: 'Associações encontradas', statusCode: 200, data };
  }

  @Get('cliente/:clienteId')
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  @ApiResponse({ status: 200, description: 'Perfis por cliente' })
  async findByCliente(@Param('clienteId') clienteId: string) {
    const data = await this.usuarioPerfilService.findByCliente(clienteId);
    return { message: 'Perfis do cliente encontrados', statusCode: 200, data };
  }

  @Put(':id')
  @SetMetadata('roles', ['Administrador', 'Editor'])
  @ApiResponse({ status: 200, description: 'Associação atualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateUsuarioPerfilDto) {
    const data = await this.usuarioPerfilService.update(id, dto);
    return {
      message: 'Associação atualizada com sucesso',
      statusCode: 200,
      data,
    };
  }

  @Delete(':id')
  @SetMetadata('roles', ['Administrador'])
  @ApiResponse({
    status: 200,
    description: 'Associação removida (soft delete)',
  })
  async remove(@Param('id') id: string) {
    await this.usuarioPerfilService.softDelete(id);
    return {
      message: 'Associação removida com sucesso',
      statusCode: 200,
    };
  }
}
