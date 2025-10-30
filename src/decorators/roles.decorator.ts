import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para definir quais perfis têm acesso ao endpoint
 * Usado em conjunto com o RolesGuard
 *
 * @example
 * @Roles('ADMIN', 'EDITOR')
 * @Get()
 * async findAll() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
