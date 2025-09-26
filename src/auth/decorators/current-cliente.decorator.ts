import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  id: string;
}


export const CurrentCliente = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user || {};
    return user.id;
  },
);