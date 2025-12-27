import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PerfilService } from './perfil.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Perfis')
@Controller('perfis')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post()
  @Permissions({ module: 'usuarios', action: 'criar' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async create(@Body() dto: CreatePerfilDto) {
    const perfil = await this.perfilService.create(dto);
    return {
      message: 'Perfil criado com sucesso',
      statusCode: HttpStatus.CREATED,
      data: perfil,
    };
  }

  @Get(':clienteId')
  @Permissions({ module: 'usuarios', action: 'listar' }, { module: 'usuarios', action: 'visualizar' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(@Param('clienteId') clienteId: string) {
    const perfis = await this.perfilService.findAll(clienteId);
    return {
      message: 'Perfis encontrados',
      statusCode: HttpStatus.OK,
      data: perfis,
    };
  }

  @Get(':clienteId/:id')
  @Permissions({ module: 'usuarios', action: 'listar' }, { module: 'usuarios', action: 'visualizar' })
  @ApiResponse({ status: HttpStatus.OK })
  async findOne(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
  ) {
    const perfil = await this.perfilService.findOne(id, clienteId);
    return {
      message: 'Perfil encontrado',
      statusCode: HttpStatus.OK,
      data: perfil,
    };
  }

  @Patch(':clienteId/:id')
  @Permissions({ module: 'usuarios', action: 'editar' })
  @ApiResponse({ status: HttpStatus.OK })
  async update(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePerfilDto,
  ) {
    const perfil = await this.perfilService.update(id, dto, clienteId);
    return {
      message: 'Perfil atualizado com sucesso',
      statusCode: HttpStatus.OK,
      data: perfil,
    };
  }

  @Delete(':clienteId/:id')
  @Permissions({ module: 'usuarios', action: 'excluir' })
  @ApiResponse({ status: HttpStatus.OK })
  async remove(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    await this.perfilService.softDelete(id, clienteId);
    return {
      message: 'Perfil excluído com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
