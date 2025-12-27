import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { UsuarioPerfilService } from '../usuario-perfil/usuario-perfil.service';
import { AuditService } from '../audit/audit.service';
import { PermissionRequirement } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usuarioPerfilService: UsuarioPerfilService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<PermissionRequirement[]>(
      'permissions',
      context.getHandler(),
    );

    // Se não há permissões definidas, permite acesso
    if (!permissions || permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: Usuario = request.user;

    if (!user) {
      return false;
    }

    const hasAccess = await this.checkPermissions(user.id, permissions);

    if (!hasAccess) {
      const ipAddress = AuditService.extractIpAddress(request);
      const resource = request.route?.path || request.url;
      const action = request.method;
      const userPermissions = await this.getUserPermissions(user.id);

      await this.auditService.logAccessDeniedNoRole(
        user.id,
        user.email,
        permissions.map((p) => `${p.module}:${p.action}`),
        Object.entries(userPermissions)
          .map(([mod, actions]) => actions.map((a) => `${mod}:${a}`))
          .flat(),
        resource,
        action,
        ipAddress,
      );
    }

    return hasAccess;
  }

  /**
   * Verifica se o usuário tem pelo menos uma das permissões requeridas (OR)
   * Também verifica se o módulo existe nas permissões do usuário
   */
  async checkPermissions(
    userId: string,
    requiredPermissions: PermissionRequirement[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);

    // Verifica se o usuário tem QUALQUER uma das permissões requeridas
    return requiredPermissions.some((required) => {
      // Se o módulo não existe nas permissões, nega acesso
      const modulePermissions = userPermissions[required.module];
      if (!modulePermissions || !Array.isArray(modulePermissions)) {
        return false;
      }
      // Verifica se tem a ação específica
      return modulePermissions.includes(required.action);
    });
  }

  /**
   * Verifica se o usuário tem acesso a um módulo específico
   */
  async hasModuleAccess(userId: string, module: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    const modulePermissions = userPermissions[module];
    return (
      modulePermissions !== undefined &&
      Array.isArray(modulePermissions) &&
      modulePermissions.length > 0
    );
  }

  /**
   * Obtém todas as permissões do usuário de todos os seus perfis
   */
  async getUserPermissions(
    userId: string,
  ): Promise<Record<string, string[]>> {
    try {
      const userPerfis = await this.usuarioPerfilService.findByUsuario(userId);

      // Combina permissões de todos os perfis do usuário
      const combinedPermissions: Record<string, Set<string>> = {};

      for (const usuarioPerfil of userPerfis) {
        const permissoes = usuarioPerfil.perfil?.permissoes;
        if (permissoes && typeof permissoes === 'object') {
          for (const [module, actions] of Object.entries(permissoes)) {
            if (Array.isArray(actions)) {
              if (!combinedPermissions[module]) {
                combinedPermissions[module] = new Set();
              }
              actions.forEach((action) =>
                combinedPermissions[module].add(action),
              );
            }
          }
        }
      }

      // Converte Sets para arrays
      const result: Record<string, string[]> = {};
      for (const [module, actions] of Object.entries(combinedPermissions)) {
        result[module] = Array.from(actions);
      }

      return result;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return {};
    }
  }
}
