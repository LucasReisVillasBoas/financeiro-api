import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmpresaGuard implements CanActivate {
  constructor(
    private readonly em: EntityManager,
    private readonly auditService: AuditService,
  ) {}

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

    const ipAddress = AuditService.extractIpAddress(request);
    const resource = request.route?.path || request.url;
    const action = request.method;

    if (!usuarioEmpresas.length) {
      // Registrar tentativa de acesso sem empresa
      await this.auditService.logAccessDeniedNoEmpresa(
        user.id,
        user.email,
        resource,
        action,
        ipAddress,
      );

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

    const empresaIdParam = request.params.empresaId || request.params.id;
    const empresaIdBody = request.body?.empresa_id;
    const clienteIdBody = request.body?.cliente_id;

    const empresaIdToCheck =
      empresaIdParam ||
      empresaIdBody ||
      request.userEmpresas[0]?.empresaId;

    if (empresaIdToCheck) {
      const hasAccess = request.userEmpresas.some(
        (emp) =>
          emp.empresaId === empresaIdToCheck ||
          emp.sedeId === empresaIdToCheck ||
          emp.filialId === empresaIdToCheck,
      );

      if (!hasAccess) {
        // Registrar tentativa de acesso a empresa não autorizada
        const userEmpresasIds = request.userEmpresas.map(
          (emp) => emp.empresaId,
        );

        await this.auditService.logAccessDeniedWrongEmpresa(
          user.id,
          user.email,
          empresaIdToCheck,
          userEmpresasIds,
          resource,
          action,
          ipAddress,
        );

        throw new ForbiddenException('Acesso negado a esta empresa');
      }
    }

    if (clienteIdBody) {
      const hasClientAccess = request.userEmpresas.some(
        (emp) => emp.clienteId === clienteIdBody,
      );

      if (!hasClientAccess) {
        // Registrar tentativa de acesso a cliente não autorizado
        const userClienteIds = request.userEmpresas.map(
          (emp) => emp.clienteId,
        );

        await this.auditService.logAccessDeniedWrongCliente(
          user.id,
          user.email,
          clienteIdBody,
          userClienteIds,
          resource,
          action,
          ipAddress,
        );

        throw new ForbiddenException('Acesso negado a este cliente');
      }
    }

    return true;
  }
}
