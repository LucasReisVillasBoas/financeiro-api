import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsuarioPerfilService } from './usuario-perfil.service';
import type { UpdateUsuarioPerfilDto } from './dto/update-usuario-perfil.dto';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  sanitizeUsuarioPerfilResponse,
  sanitizeUsuarioPerfisResponse,
} from '../utils/usuario-perfil.util';

@ApiTags('Usuário-Perfil')
@Controller('usuario-perfil')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsuarioPerfilController {
  constructor(private readonly usuarioPerfilService: UsuarioPerfilService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions({ module: 'usuarios', action: 'listar' }, { module: 'usuarios', action: 'visualizar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfis do usuário logado',
  })
  async findMyProfiles(@CurrentUser() user: any) {
    const data = await this.usuarioPerfilService.findByUsuario(user.id);
    return {
      message: 'Perfis encontrados',
      statusCode: HttpStatus.OK,
      data: sanitizeUsuarioPerfisResponse(data),
    };
  }

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions({ module: 'usuarios', action: 'editar' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Associação atualizada' })
  async update(@Param('id') id: string, @Body() dto: UpdateUsuarioPerfilDto) {
    const data = await this.usuarioPerfilService.update(id, dto);
    return {
      message: 'Associação atualizada com sucesso',
      statusCode: HttpStatus.OK,
      data: sanitizeUsuarioPerfilResponse(data),
    };
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions({ module: 'usuarios', action: 'excluir' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Associação removida (soft delete)',
  })
  async remove(@Param('id') id: string) {
    await this.usuarioPerfilService.softDelete(id);
    return {
      message: 'Associação removida com sucesso',
      statusCode: HttpStatus.OK,
    };
  }
}
