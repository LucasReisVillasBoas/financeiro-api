import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para obter o usuário autenticado da request
 * O usuário é injetado pelo JwtAuthGuard
 *
 * @example
 * @Get()
 * async findAll(@CurrentUser() user: any) {
 *   console.log(user.id, user.email);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
