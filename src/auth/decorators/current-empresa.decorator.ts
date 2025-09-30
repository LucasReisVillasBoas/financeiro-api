import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserEmpresa {
  empresaId: string;
  clienteId: string;
  isFilial: boolean;
  sedeId: string | null;
}

export const CurrentEmpresas = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserEmpresa[] => {
    const request = ctx.switchToHttp().getRequest();
    return request.userEmpresas || [];
  },
);

export const CurrentEmpresaIds = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const userEmpresas: UserEmpresa[] = request.userEmpresas || [];
    return userEmpresas.map((emp) => emp.empresaId);
  },
);

export const CurrentClienteIds = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    const userEmpresas: UserEmpresa[] = request.userEmpresas || [];
    return [...new Set(userEmpresas.map((emp) => emp.clienteId))];
  },
);
