import { SetMetadata } from '@nestjs/common';

export interface PermissionRequirement {
  module: string;
  action: string;
}

/**
 * Decorator para definir permissões necessárias para acessar um endpoint
 *
 * @example
 * // Requer permissão de 'listar' no módulo 'usuarios'
 * @Permissions({ module: 'usuarios', action: 'listar' })
 *
 * @example
 * // Requer qualquer uma das permissões (OR)
 * @Permissions(
 *   { module: 'usuarios', action: 'criar' },
 *   { module: 'usuarios', action: 'editar' }
 * )
 */
export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata('permissions', permissions);

/**
 * Atalhos para permissões comuns
 */
export const CanCreate = (module: string) =>
  Permissions({ module, action: 'criar' });

export const CanEdit = (module: string) =>
  Permissions({ module, action: 'editar' });

export const CanList = (module: string) =>
  Permissions({ module, action: 'listar' });

export const CanDelete = (module: string) =>
  Permissions({ module, action: 'excluir' });

export const CanView = (module: string) =>
  Permissions({ module, action: 'visualizar' });
