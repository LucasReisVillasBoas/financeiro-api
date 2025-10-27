import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  SetMetadata,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PerfilService } from './perfil.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Perfis')
@Controller('perfis')
@UseGuards(RolesGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post()
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
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
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
  @SetMetadata('roles', ['Administrador', 'Editor'])
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
  @SetMetadata('roles', ['Administrador'])
  @ApiResponse({ status: HttpStatus.OK })
  async remove(@Param('clienteId') clienteId: string, @Param('id') id: string) {
    await this.perfilService.softDelete(id, clienteId);
    return {
      message: 'Perfil excluído com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
