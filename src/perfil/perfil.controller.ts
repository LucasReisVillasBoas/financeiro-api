import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PerfilService } from './perfil.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@ApiTags('Perfis')
@Controller('perfis')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post()
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreatePerfilDto, @Req() req: any) {
    const perfil = await this.perfilService.create(dto, req.user);
    return {
      message: 'Perfil criado com sucesso',
      statusCode: 201,
      data: perfil,
    };
  }

  @Get(':clienteId')
  @ApiResponse({ status: 200 })
  async findAll(@Param('clienteId') clienteId: string) {
    const perfis = await this.perfilService.findAll(clienteId);
    return { message: 'Perfis encontrados', statusCode: 200, data: perfis };
  }

  @Get(':clienteId/:id')
  @ApiResponse({ status: 200 })
  async findOne(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
  ) {
    const perfil = await this.perfilService.findOne(id, clienteId);
    return { message: 'Perfil encontrado', statusCode: 200, data: perfil };
  }

  @Patch(':clienteId/:id')
  @ApiResponse({ status: 200 })
  async update(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePerfilDto,
    @Req() req: any,
  ) {
    const perfil = await this.perfilService.update(
      id,
      dto,
      req.user,
      clienteId,
    );
    return {
      message: 'Perfil atualizado com sucesso',
      statusCode: 200,
      data: perfil,
    };
  }

  @Delete(':clienteId/:id')
  @ApiResponse({ status: 200 })
  async remove(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    await this.perfilService.softDelete(id, clienteId);
    return { message: 'Perfil excluído com sucesso', statusCode: 200 };
  }
}
