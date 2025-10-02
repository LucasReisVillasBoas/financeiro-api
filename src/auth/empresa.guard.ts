import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';

@Injectable()
export class EmpresaGuard implements CanActivate {
  constructor(private readonly em: EntityManager) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const usuarioEmpresas = await this.em.find(
      UsuarioEmpresaFilial,
      {
        usuario: user.id,
      },
      {
        populate: ['empresa'],
      },
    );

    if (!usuarioEmpresas.length) {
      throw new ForbiddenException(
        'Usuário não possui acesso a nenhuma empresa',
      );
    }

    request.userEmpresas = usuarioEmpresas.map((ue) => ({
      empresaId: ue.empresa.id,
      clienteId: ue.empresa.cliente_id,
      isFilial: ue.filial,
      sedeId: ue.empresa.sede?.id || null,
    }));

    const empresaIdParam =
      request.params.empresaId ||
      request.userEmpresas[0]?.empresaId ||
      request.params.id;
    const empresaIdBody = request.body?.empresa_id;
    const clienteIdBody = request.body?.cliente_id;

    const empresaIdToCheck = empresaIdParam || empresaIdBody;

    if (empresaIdToCheck) {
      const hasAccess = request.userEmpresas.some(
        (emp) =>
          emp.empresaId === empresaIdToCheck ||
          emp.sedeId === empresaIdToCheck ||
          emp.filialId === empresaIdToCheck,
      );

      if (!hasAccess) {
        throw new ForbiddenException('Acesso negado a esta empresa');
      }
    }

    if (clienteIdBody) {
      const hasClientAccess = request.userEmpresas.some(
        (emp) => emp.clienteId === clienteIdBody,
      );

      if (!hasClientAccess) {
        throw new ForbiddenException('Acesso negado a este cliente');
      }
    }

    return true;
  }
}
