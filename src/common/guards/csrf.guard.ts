import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_CSRF_CHECK = 'skipCsrfCheck';
export const SkipCsrfCheck = () => SetMetadata(SKIP_CSRF_CHECK, true);

/**
 * Guard para proteção contra CSRF em APIs REST
 *
 * Proteção baseada em:
 * 1. Verificação de header customizado (X-Requested-With)
 * 2. Verificação de Origin/Referer
 * 3. Exemção para métodos GET e HEAD (safe methods)
 *
 * Este guard implementa "Custom Header CSRF Protection" que é adequado
 * para APIs stateless com autenticação JWT.
 *
 * Referência: OWASP CSRF Prevention Cheat Sheet
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar se o endpoint tem decorator @SkipCsrfCheck()
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method.toUpperCase();

    // GET, HEAD, OPTIONS são considerados "safe methods" pela RFC
    // Não modificam estado, então não precisam de proteção CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Verificar header customizado (X-Requested-With)
    // Navegadores não permitem que sites maliciosos definam este header
    // devido à Same-Origin Policy
    const xRequestedWith = request.headers['x-requested-with'];
    if (xRequestedWith === 'XMLHttpRequest' || xRequestedWith === 'fetch') {
      return true;
    }

    // Verificar Origin/Referer para validar que a requisição vem do domínio correto
    const origin = request.headers.origin || request.headers.referer;
    if (origin && this.isValidOrigin(origin, request.headers.host)) {
      return true;
    }

    // Se chegou aqui, não passou em nenhuma verificação
    throw new ForbiddenException(
      'Possível ataque CSRF detectado. Inclua o header X-Requested-With na requisição.',
    );
  }

  /**
   * Valida se o origin é do mesmo domínio ou de um domínio permitido
   */
  private isValidOrigin(origin: string, host: string): boolean {
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host;

      // Permitir requisições do mesmo host
      if (originHost === host) {
        return true;
      }

      // Permitir localhost em desenvolvimento
      if (
        process.env.NODE_ENV === 'development' &&
        (originHost.includes('localhost') || originHost.includes('127.0.0.1'))
      ) {
        return true;
      }

      // Aqui você pode adicionar outros domínios permitidos
      // const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      // return allowedOrigins.includes(originUrl.origin);

      return false;
    } catch {
      return false;
    }
  }
}
