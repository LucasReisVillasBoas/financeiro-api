import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  HttpStatus,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import { UsuarioUpdateRequestDto } from './dto/usuario-update-request.dto';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioService } from './usuario.service';
import { BaseResponse } from '../dto/base-response.dto';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { AssociarEmpresaFilialRequestDto } from './dto/associar-empresa-filial-request.dto';

import { RolesGuard } from 'src/auth/roles.guard';
import { SetMetadata, UseGuards } from '@nestjs/common';
import { CurrentCliente } from '../auth/decorators/current-cliente.decorator';
import {
  sanitizeUserResponse,
  sanitizeUsersResponse,
} from '../utils/user.util';
import { EmpresaGuard } from '../auth/empresa.guard';
import { CurrentEmpresaIds } from '../auth/decorators/current-empresa.decorator';

@Controller('usuario')
@ApiTags('Usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @ApiResponse({
    status: HttpStatus.CREATED,
    type: Usuario,
    description: 'Usuário criado',
  })
  @Post('cadastro')
  async createUsuario(
    @Body() dto: UsuarioCreateRequestDto,
  ): Promise<BaseResponse<Usuario>> {
    const usuario = await this.usuarioService.create(dto);
    return {
      message: 'Usuário criado',
      statusCode: HttpStatus.CREATED,
      data: sanitizeUserResponse(usuario),
    };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: Usuario,
    description: 'Usuário',
  })
  @Get()
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async getById(
    @CurrentCliente() cliente: string,
  ): Promise<BaseResponse<Usuario>> {
    const usuario = await this.usuarioService.findOne(cliente);
    return {
      message: 'Usuário encontrado com sucesso',
      statusCode: HttpStatus.OK,
      data: sanitizeUserResponse(usuario),
    };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: Usuario,
    description: 'Usuários',
  })
  @Get('all')
  @UseGuards(RolesGuard, EmpresaGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async getAll(
    @CurrentEmpresaIds() empresaIds: string[],
  ): Promise<BaseResponse<Usuario[]>> {
    const usuarios = await this.usuarioService.findAll(empresaIds);
    return {
      message: 'Usuários encontrado com sucesso',
      statusCode: HttpStatus.OK,
      data: sanitizeUsersResponse(usuarios),
    };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: Usuario,
    description: 'Usuário por ID',
  })
  @Get('id/:id')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async getOne(@Param('id') id: string): Promise<BaseResponse<Usuario>> {
    const usuario = await this.usuarioService.findOne(id);
    return {
      message: 'Usuário encontrado com sucesso',
      statusCode: HttpStatus.OK,
      data: usuario,
    };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: Usuario,
    description: 'Usuário atualizado',
  })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador'])
  async updateUsuario(
    @Param('id') id: string,
    @Body() dto: UsuarioUpdateRequestDto,
  ): Promise<BaseResponse<Usuario>> {
    const usuario = await this.usuarioService.update(id, dto);
    return {
      message: 'Usuário atualizado',
      statusCode: HttpStatus.OK,
      data: sanitizeUserResponse(usuario),
    };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: BaseResponse<UsuarioEmpresaFilial>,
    description: 'Associar usuario a empresa ou filial',
  })
  @Post(':id/empresas')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador'])
  async associarEmpresaOuFilial(
    @Param('id') usuarioId: string,
    @Body() dto: AssociarEmpresaFilialRequestDto,
    @CurrentCliente() cliente: string,
  ): Promise<BaseResponse<UsuarioEmpresaFilial>> {
    const result = await this.usuarioService.associarEmpresaOuFilial(
      usuarioId,
      dto,
      cliente,
    );
    return new BaseResponse<UsuarioEmpresaFilial>(
      'Associação feita com sucesso!',
      HttpStatus.OK,
      result,
    );
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: BaseResponse<UsuarioEmpresaFilial>,
    description: 'Listar usuarios associados a empresa',
  })
  @Get(':id/empresas')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador', 'Editor', 'Visualizador'])
  async listarAssociacoes(
    @Param('id') usuarioId: string,
  ): Promise<BaseResponse<UsuarioEmpresaFilial[]>> {
    const result = await this.usuarioService.listarAssociacoes(usuarioId);
    return new BaseResponse<UsuarioEmpresaFilial[]>(
      'Associações listadas com sucesso!',
      HttpStatus.OK,
      result,
    );
  }

  @Delete(':id/empresas/:assocId')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Administrador'])
  async removerAssociacao(
    @Param('id') usuarioId: string,
    @Param('assocId') assocId: string,
  ): Promise<BaseResponse<void>> {
    await this.usuarioService.removerAssociacao(usuarioId, assocId);
    return new BaseResponse<void>(
      'Associação removida com sucesso!',
      HttpStatus.OK,
    );
  }
}
