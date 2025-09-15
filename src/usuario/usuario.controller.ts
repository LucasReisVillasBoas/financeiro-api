import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioService } from './usuario.service';
import type { BaseResponse } from '../dto/base-response.dto';

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
}
