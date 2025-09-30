import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { UsuarioPerfilService } from '../usuario-perfil/usuario-perfil.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usuarioPerfilService: UsuarioPerfilService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;
    if (!user) {
      return false;
    }
    return await this.matchRoles(roles, user.id);
  }

  async matchRoles(roles: string[], userId: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return roles.some((role) => userRoles.includes(role));
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const userRoles = await this.usuarioPerfilService.findByCliente(userId);
      return userRoles
        .map((usuarioPerfil) => usuarioPerfil.perfil?.nome)
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }
}
