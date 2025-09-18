import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioService } from './usuario.service';
import { BaseResponse } from '../dto/base-response.dto';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { AssociarEmpresaFilialRequestDto } from './dto/associar-empresa-filial-request.dto';

@Controller('usuario')
@ApiTags('Usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @ApiResponse({
    status: 201,
    type: Usuario,
    description: 'Usuário criado',
  })
  @Post('cadastro')
  async createUsuario(
    @Body() dto: UsuarioCreateRequestDto,
  ): Promise<BaseResponse<Usuario>> {
    const usuario = await this.usuarioService.create(dto);
    return { message: 'Usuário criado', statusCode: 201, data: usuario };
  }

  @ApiResponse({
    status: 200,
    type: BaseResponse<UsuarioEmpresaFilial>,
    description: 'Associar usuario a empresa ou filial',
  })
  @Post(':id/empresas')
  async associarEmpresaOuFilial(
    @Param('id') usuarioId: string,
    @Body() dto: AssociarEmpresaFilialRequestDto,
  ): Promise<BaseResponse<Promise<UsuarioEmpresaFilial>>> {
    const result = this.usuarioService.associarEmpresaOuFilial(usuarioId, dto);
    return new BaseResponse<Promise<UsuarioEmpresaFilial>>(
      'Associação feita com sucesso!',
      200,
      result,
    );
  }

  @ApiResponse({
    status: 200,
    type: BaseResponse<UsuarioEmpresaFilial>,
    description: 'Listar usuarios associados a empresa',
  })
  @Get(':id/empresas')
  async listarAssociacoes(@Param('id') usuarioId: string) {
    return this.usuarioService.listarAssociacoes(usuarioId);
  }

  @Delete(':id/empresas/:assocId')
  async removerAssociacao(
    @Param('id') usuarioId: string,
    @Param('assocId') assocId: string,
  ) {
    return this.usuarioService.removerAssociacao(usuarioId, assocId);
  }
}
