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

  @Get('cliente/:clienteId')
  @UseGuards(PermissionsGuard)
  @Permissions({ module: 'usuarios', action: 'listar' }, { module: 'usuarios', action: 'visualizar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Todos os perfis vinculados às empresas do cliente',
  })
  async findByCliente(@Param('clienteId') clienteId: string) {
    const { usuariosPerfis, todasEmpresas } =
      await this.usuarioPerfilService.findByClienteComEmpresas(clienteId);

    // Agrupa por usuário+perfil para mostrar múltiplas empresas na mesma linha
    const agrupado = new Map<
      string,
      {
        id: string;
        ativo: boolean;
        usuario: {
          id: string;
          nome: string;
          login: string;
          ativo: boolean;
        };
        empresas: Array<{
          id: string;
          nome_fantasia: string;
          razao_social: string;
          isFilial: boolean;
        }>;
        perfil: {
          id: string;
          nome: string;
        };
      }
    >();

    for (const up of usuariosPerfis) {
      const chave = `${up.usuario.id}-${up.perfil.id}`;
      const empresaInfo = {
        id: up.empresa.id,
        nome_fantasia: up.empresa.nome_fantasia,
        razao_social: up.empresa.razao_social,
        isFilial: !!up.empresa.sede,
      };

      if (agrupado.has(chave)) {
        // Evita duplicar empresa
        const existente = agrupado.get(chave)!;
        if (!existente.empresas.some((e) => e.id === empresaInfo.id)) {
          existente.empresas.push(empresaInfo);
        }
      } else {
        agrupado.set(chave, {
          id: up.id,
          ativo: up.ativo,
          usuario: {
            id: up.usuario.id,
            nome: up.usuario.nome,
            login: up.usuario.login,
            ativo: up.usuario.ativo,
          },
          empresas: [empresaInfo],
          perfil: {
            id: up.perfil.id,
            nome: up.perfil.nome,
          },
        });
      }
    }

    // Para o usuário que é o cliente/dono, adiciona todas as empresas dele
    for (const [chave, registro] of agrupado.entries()) {
      if (registro.usuario.id === clienteId) {
        // É o dono - adiciona todas as empresas que ele ainda não tem
        for (const empresa of todasEmpresas) {
          if (!registro.empresas.some((e) => e.id === empresa.id)) {
            registro.empresas.push({
              id: empresa.id,
              nome_fantasia: empresa.nome_fantasia,
              razao_social: empresa.razao_social,
              isFilial: !!empresa.sede,
            });
          }
        }
        // Ordena: sedes primeiro, depois filiais
        registro.empresas.sort((a, b) => {
          if (a.isFilial === b.isFilial) return 0;
          return a.isFilial ? 1 : -1;
        });
      }
    }

    return {
      message: 'Perfis encontrados',
      statusCode: HttpStatus.OK,
      data: Array.from(agrupado.values()),
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
