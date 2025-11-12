import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Auditoria } from '../entities/auditoria/auditoria.entity';
import { AuditoriaRepository } from './audit.repository';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Empresa } from '../entities/empresa/empresa.entity';

export enum AuditEventType {
  // Autenticação
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Autorização
  ACCESS_DENIED_NO_ROLE = 'ACCESS_DENIED_NO_ROLE',
  ACCESS_DENIED_NO_EMPRESA = 'ACCESS_DENIED_NO_EMPRESA',
  ACCESS_DENIED_WRONG_EMPRESA = 'ACCESS_DENIED_WRONG_EMPRESA',
  ACCESS_DENIED_WRONG_CLIENTE = 'ACCESS_DENIED_WRONG_CLIENTE',
  ACCESS_GRANTED = 'ACCESS_GRANTED',

  // Operações em Empresas
  EMPRESA_CREATED = 'EMPRESA_CREATED',
  EMPRESA_UPDATED = 'EMPRESA_UPDATED',
  EMPRESA_DELETED = 'EMPRESA_DELETED',
  EMPRESA_ACCESSED = 'EMPRESA_ACCESSED',

  // Operações em Usuários
  USUARIO_CREATED = 'USUARIO_CREATED',
  USUARIO_UPDATED = 'USUARIO_UPDATED',
  USUARIO_DELETED = 'USUARIO_DELETED',
  USUARIO_PERFIL_CHANGED = 'USUARIO_PERFIL_CHANGED',

  // Operações em Perfis
  PERFIL_CREATED = 'PERFIL_CREATED',
  PERFIL_UPDATED = 'PERFIL_UPDATED',
  PERFIL_DELETED = 'PERFIL_DELETED',

  // Operações Financeiras
  CONTA_PAGAR_CREATED = 'CONTA_PAGAR_CREATED',
  CONTA_PAGAR_UPDATED = 'CONTA_PAGAR_UPDATED',
  CONTA_PAGAR_DELETED = 'CONTA_PAGAR_DELETED',
  CONTA_RECEBER_CREATED = 'CONTA_RECEBER_CREATED',
  CONTA_RECEBER_UPDATED = 'CONTA_RECEBER_UPDATED',
  CONTA_RECEBER_DELETED = 'CONTA_RECEBER_DELETED',
  CONTA_BANCARIA_CREATED = 'CONTA_BANCARIA_CREATED',
  CONTA_BANCARIA_UPDATED = 'CONTA_BANCARIA_UPDATED',
  CONTA_BANCARIA_SALDO_INICIAL_UPDATED = 'CONTA_BANCARIA_SALDO_INICIAL_UPDATED',
  CONTA_BANCARIA_DELETED = 'CONTA_BANCARIA_DELETED',

  // Movimentação Bancária
  MOVIMENTACAO_BANCARIA_CREATED = 'MOVIMENTACAO_BANCARIA_CREATED',
  MOVIMENTACAO_BANCARIA_UPDATED = 'MOVIMENTACAO_BANCARIA_UPDATED',
  MOVIMENTACAO_BANCARIA_DELETED = 'MOVIMENTACAO_BANCARIA_DELETED',

  // Plano de Contas
  PLANO_CONTAS_CREATED = 'PLANO_CONTAS_CREATED',
  PLANO_CONTAS_UPDATED = 'PLANO_CONTAS_UPDATED',
  PLANO_CONTAS_DELETED = 'PLANO_CONTAS_DELETED',
  PLANO_CONTAS_STATUS_CHANGED = 'PLANO_CONTAS_STATUS_CHANGED',

  // Pessoas (Fornecedores/Clientes)
  PESSOA_CREATED = 'PESSOA_CREATED',
  PESSOA_UPDATED = 'PESSOA_UPDATED',
  PESSOA_DELETED = 'PESSOA_DELETED',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  empresaId?: string;
  resource?: string;
  action?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Mapeamento de EventType para ação/módulo
 */
const EVENT_TYPE_MAPPING: Record<
  AuditEventType,
  { acao: string; modulo: string }
> = {
  // Autenticação
  [AuditEventType.LOGIN_SUCCESS]: { acao: 'LOGIN', modulo: 'AUTH' },
  [AuditEventType.LOGIN_FAILED]: { acao: 'LOGIN', modulo: 'AUTH' },
  [AuditEventType.LOGOUT]: { acao: 'LOGOUT', modulo: 'AUTH' },
  [AuditEventType.TOKEN_EXPIRED]: { acao: 'TOKEN_EXPIRED', modulo: 'AUTH' },
  [AuditEventType.TOKEN_INVALID]: { acao: 'TOKEN_INVALID', modulo: 'AUTH' },

  // Autorização
  [AuditEventType.ACCESS_DENIED_NO_ROLE]: {
    acao: 'ACCESS_DENIED',
    modulo: 'AUTHORIZATION',
  },
  [AuditEventType.ACCESS_DENIED_NO_EMPRESA]: {
    acao: 'ACCESS_DENIED',
    modulo: 'AUTHORIZATION',
  },
  [AuditEventType.ACCESS_DENIED_WRONG_EMPRESA]: {
    acao: 'ACCESS_DENIED',
    modulo: 'AUTHORIZATION',
  },
  [AuditEventType.ACCESS_DENIED_WRONG_CLIENTE]: {
    acao: 'ACCESS_DENIED',
    modulo: 'AUTHORIZATION',
  },
  [AuditEventType.ACCESS_GRANTED]: {
    acao: 'ACCESS_GRANTED',
    modulo: 'AUTHORIZATION',
  },

  // Empresas
  [AuditEventType.EMPRESA_CREATED]: { acao: 'CREATE', modulo: 'EMPRESA' },
  [AuditEventType.EMPRESA_UPDATED]: { acao: 'UPDATE', modulo: 'EMPRESA' },
  [AuditEventType.EMPRESA_DELETED]: { acao: 'DELETE', modulo: 'EMPRESA' },
  [AuditEventType.EMPRESA_ACCESSED]: { acao: 'READ', modulo: 'EMPRESA' },

  // Usuários
  [AuditEventType.USUARIO_CREATED]: { acao: 'CREATE', modulo: 'USUARIO' },
  [AuditEventType.USUARIO_UPDATED]: { acao: 'UPDATE', modulo: 'USUARIO' },
  [AuditEventType.USUARIO_DELETED]: { acao: 'DELETE', modulo: 'USUARIO' },
  [AuditEventType.USUARIO_PERFIL_CHANGED]: {
    acao: 'PERFIL_CHANGE',
    modulo: 'USUARIO',
  },

  // Perfis
  [AuditEventType.PERFIL_CREATED]: { acao: 'CREATE', modulo: 'PERFIL' },
  [AuditEventType.PERFIL_UPDATED]: { acao: 'UPDATE', modulo: 'PERFIL' },
  [AuditEventType.PERFIL_DELETED]: { acao: 'DELETE', modulo: 'PERFIL' },

  // Financeiro
  [AuditEventType.CONTA_PAGAR_CREATED]: {
    acao: 'CREATE',
    modulo: 'CONTA_PAGAR',
  },
  [AuditEventType.CONTA_PAGAR_UPDATED]: {
    acao: 'UPDATE',
    modulo: 'CONTA_PAGAR',
  },
  [AuditEventType.CONTA_PAGAR_DELETED]: {
    acao: 'DELETE',
    modulo: 'CONTA_PAGAR',
  },
  [AuditEventType.CONTA_RECEBER_CREATED]: {
    acao: 'CREATE',
    modulo: 'CONTA_RECEBER',
  },
  [AuditEventType.CONTA_RECEBER_UPDATED]: {
    acao: 'UPDATE',
    modulo: 'CONTA_RECEBER',
  },
  [AuditEventType.CONTA_RECEBER_DELETED]: {
    acao: 'DELETE',
    modulo: 'CONTA_RECEBER',
  },
  [AuditEventType.CONTA_BANCARIA_CREATED]: {
    acao: 'CREATE',
    modulo: 'CONTA_BANCARIA',
  },
  [AuditEventType.CONTA_BANCARIA_UPDATED]: {
    acao: 'UPDATE',
    modulo: 'CONTA_BANCARIA',
  },
  [AuditEventType.CONTA_BANCARIA_SALDO_INICIAL_UPDATED]: {
    acao: 'SALDO_INICIAL_UPDATE',
    modulo: 'CONTA_BANCARIA',
  },
  [AuditEventType.CONTA_BANCARIA_DELETED]: {
    acao: 'DELETE',
    modulo: 'CONTA_BANCARIA',
  },

  // Movimentação Bancária
  [AuditEventType.MOVIMENTACAO_BANCARIA_CREATED]: {
    acao: 'CREATE',
    modulo: 'MOVIMENTACAO_BANCARIA',
  },
  [AuditEventType.MOVIMENTACAO_BANCARIA_UPDATED]: {
    acao: 'UPDATE',
    modulo: 'MOVIMENTACAO_BANCARIA',
  },
  [AuditEventType.MOVIMENTACAO_BANCARIA_DELETED]: {
    acao: 'DELETE',
    modulo: 'MOVIMENTACAO_BANCARIA',
  },

  // Plano de Contas
  [AuditEventType.PLANO_CONTAS_CREATED]: {
    acao: 'CREATE',
    modulo: 'PLANO_CONTAS',
  },
  [AuditEventType.PLANO_CONTAS_UPDATED]: {
    acao: 'UPDATE',
    modulo: 'PLANO_CONTAS',
  },
  [AuditEventType.PLANO_CONTAS_DELETED]: {
    acao: 'DELETE',
    modulo: 'PLANO_CONTAS',
  },
  [AuditEventType.PLANO_CONTAS_STATUS_CHANGED]: {
    acao: 'STATUS_CHANGE',
    modulo: 'PLANO_CONTAS',
  },

  // Pessoas
  [AuditEventType.PESSOA_CREATED]: { acao: 'CREATE', modulo: 'PESSOA' },
  [AuditEventType.PESSOA_UPDATED]: { acao: 'UPDATE', modulo: 'PESSOA' },
  [AuditEventType.PESSOA_DELETED]: { acao: 'DELETE', modulo: 'PESSOA' },
};

/**
 * Serviço de Auditoria - Implementação com Banco de Dados
 *
 * Registra logs de auditoria IMUTÁVEIS no banco de dados PostgreSQL
 * Os dados são protegidos por triggers no banco que impedem UPDATE e DELETE
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: AuditoriaRepository,
    private readonly em: EntityManager,
  ) {}

  /**
   * Registra um evento de auditoria genérico
   * IMPORTANTE: Registros são IMUTÁVEIS após criação
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const mapping = EVENT_TYPE_MAPPING[entry.eventType];
      const resultado = entry.success
        ? 'SUCESSO'
        : entry.severity === AuditSeverity.WARNING ||
            entry.severity === AuditSeverity.ERROR
          ? 'NEGADO'
          : 'FALHA';

      // Validar se a empresa existe antes de criar a referência
      let empresaRef = undefined;
      if (entry.empresaId) {
        const empresaExists = await this.em.findOne(Empresa, {
          id: entry.empresaId,
        });
        if (empresaExists) {
          empresaRef = this.em.getReference(Empresa, entry.empresaId);
        }
      }

      const auditoria = this.auditoriaRepository.create({
        usuario: entry.userId
          ? this.em.getReference(Usuario, entry.userId)
          : undefined,
        acao: mapping.acao,
        modulo: mapping.modulo,
        empresa: empresaRef,
        data_hora: entry.timestamp,
        resultado: resultado as 'SUCESSO' | 'FALHA' | 'NEGADO',
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        detalhes: {
          eventType: entry.eventType,
          resource: entry.resource,
          action: entry.action,
          userEmail: entry.userEmail,
          ...entry.details,
        },
        mensagem_erro: entry.errorMessage,
      });

      // Persistir no banco
      await this.em.persistAndFlush(auditoria);

      // Também logar no console para debug (pode ser removido em produção)
      const logMessage = this.formatLogEntry(entry);
      switch (entry.severity) {
        case AuditSeverity.CRITICAL:
        case AuditSeverity.ERROR:
          console.error('[AUDIT]', logMessage);
          break;
        case AuditSeverity.WARNING:
          console.warn('[AUDIT]', logMessage);
          break;
        default:
          console.log('[AUDIT]', logMessage);
      }
    } catch (error) {
      // Nunca devemos falhar uma operação por erro no log de auditoria
      // Mas devemos registrar o erro
      console.error('[AUDIT ERROR] Falha ao registrar auditoria:', error);
    }
  }

  /**
   * Registra tentativa de login
   */
  async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    userId?: string,
    empresaId?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: success
        ? AuditEventType.LOGIN_SUCCESS
        : AuditEventType.LOGIN_FAILED,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      userId,
      userEmail: email,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      details: {
        email,
      },
      empresaId,
    });
  }

  /**
   * Registra logout
   */
  async logLogout(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.LOGOUT,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Registra tentativa de acesso negado por falta de role
   */
  async logAccessDeniedNoRole(
    userId: string,
    userEmail: string,
    requiredRoles: string[],
    userRoles: string[],
    resource: string,
    action: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.ACCESS_DENIED_NO_ROLE,
      severity: AuditSeverity.WARNING,
      userId,
      userEmail,
      resource,
      action,
      ipAddress,
      success: false,
      details: {
        requiredRoles,
        userRoles,
        message: 'Usuário não possui perfil adequado',
      },
    });
  }

  /**
   * Registra tentativa de acesso negado por empresa inválida
   */
  async logAccessDeniedWrongEmpresa(
    userId: string,
    userEmail: string,
    empresaId: string,
    userEmpresasIds: string[],
    resource: string,
    action: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.ACCESS_DENIED_WRONG_EMPRESA,
      severity: AuditSeverity.WARNING,
      userId,
      userEmail,
      empresaId,
      resource,
      action,
      ipAddress,
      success: false,
      details: {
        attemptedEmpresaId: empresaId,
        userEmpresasIds,
        message: 'Usuário tentou acessar empresa não vinculada',
      },
    });
  }

  /**
   * Registra tentativa de acesso negado por cliente inválido
   */
  async logAccessDeniedWrongCliente(
    userId: string,
    userEmail: string,
    clienteId: string,
    userClienteIds: string[],
    resource: string,
    action: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.ACCESS_DENIED_WRONG_CLIENTE,
      severity: AuditSeverity.WARNING,
      userId,
      userEmail,
      resource,
      action,
      ipAddress,
      success: false,
      details: {
        attemptedClienteId: clienteId,
        userClienteIds,
        message: 'Usuário tentou acessar cliente não vinculado',
      },
    });
  }

  /**
   * Registra acesso negado por usuário sem empresas
   */
  async logAccessDeniedNoEmpresa(
    userId: string,
    userEmail: string,
    resource: string,
    action: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.ACCESS_DENIED_NO_EMPRESA,
      severity: AuditSeverity.ERROR,
      userId,
      userEmail,
      resource,
      action,
      ipAddress,
      success: false,
      details: {
        message: 'Usuário não possui acesso a nenhuma empresa',
      },
    });
  }

  /**
   * Registra acesso concedido
   */
  async logAccessGranted(
    userId: string,
    userEmail: string,
    empresaId: string | undefined,
    resource: string,
    action: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.ACCESS_GRANTED,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      empresaId,
      resource,
      action,
      ipAddress,
      success: true,
    });
  }

  /**
   * Registra token inválido ou expirado
   */
  async logInvalidToken(
    reason: 'expired' | 'invalid',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType:
        reason === 'expired'
          ? AuditEventType.TOKEN_EXPIRED
          : AuditEventType.TOKEN_INVALID,
      severity: AuditSeverity.WARNING,
      ipAddress,
      userAgent,
      success: false,
      details: {
        reason,
      },
    });
  }

  /**
   * Registra criação de entidade
   */
  async logEntityCreated(
    modulo:
      | 'EMPRESA'
      | 'USUARIO'
      | 'PERFIL'
      | 'CONTA_PAGAR'
      | 'CONTA_RECEBER'
      | 'CONTA_BANCARIA'
      | 'PLANO_CONTAS',
    entityId: string,
    userId: string,
    userEmail: string,
    empresaId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    const eventTypeMap = {
      EMPRESA: AuditEventType.EMPRESA_CREATED,
      USUARIO: AuditEventType.USUARIO_CREATED,
      PERFIL: AuditEventType.PERFIL_CREATED,
      CONTA_PAGAR: AuditEventType.CONTA_PAGAR_CREATED,
      CONTA_RECEBER: AuditEventType.CONTA_RECEBER_CREATED,
      CONTA_BANCARIA: AuditEventType.CONTA_BANCARIA_CREATED,
      PLANO_CONTAS: AuditEventType.PLANO_CONTAS_CREATED,
    };

    await this.log({
      timestamp: new Date(),
      eventType: eventTypeMap[modulo],
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      empresaId,
      success: true,
      details: {
        entityId,
        ...details,
      },
    });
  }

  /**
   * Registra atualização de entidade
   */
  async logEntityUpdated(
    modulo:
      | 'EMPRESA'
      | 'USUARIO'
      | 'PERFIL'
      | 'CONTA_PAGAR'
      | 'CONTA_RECEBER'
      | 'CONTA_BANCARIA'
      | 'PLANO_CONTAS',
    entityId: string,
    userId: string,
    userEmail: string,
    empresaId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    const eventTypeMap = {
      EMPRESA: AuditEventType.EMPRESA_UPDATED,
      USUARIO: AuditEventType.USUARIO_UPDATED,
      PERFIL: AuditEventType.PERFIL_UPDATED,
      CONTA_PAGAR: AuditEventType.CONTA_PAGAR_UPDATED,
      CONTA_RECEBER: AuditEventType.CONTA_RECEBER_UPDATED,
      CONTA_BANCARIA: AuditEventType.CONTA_BANCARIA_UPDATED,
      PLANO_CONTAS: AuditEventType.PLANO_CONTAS_UPDATED,
    };

    await this.log({
      timestamp: new Date(),
      eventType: eventTypeMap[modulo],
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      empresaId,
      success: true,
      details: {
        entityId,
        ...details,
      },
    });
  }

  /**
   * Registra exclusão de entidade (CRÍTICO)
   */
  async logEntityDeleted(
    modulo:
      | 'EMPRESA'
      | 'USUARIO'
      | 'PERFIL'
      | 'CONTA_PAGAR'
      | 'CONTA_RECEBER'
      | 'CONTA_BANCARIA'
      | 'PLANO_CONTAS',
    entityId: string,
    userId: string,
    userEmail: string,
    empresaId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    const eventTypeMap = {
      EMPRESA: AuditEventType.EMPRESA_DELETED,
      USUARIO: AuditEventType.USUARIO_DELETED,
      PERFIL: AuditEventType.PERFIL_DELETED,
      CONTA_PAGAR: AuditEventType.CONTA_PAGAR_DELETED,
      CONTA_RECEBER: AuditEventType.CONTA_RECEBER_DELETED,
      CONTA_BANCARIA: AuditEventType.CONTA_BANCARIA_DELETED,
      PLANO_CONTAS: AuditEventType.PLANO_CONTAS_DELETED,
    };

    await this.log({
      timestamp: new Date(),
      eventType: eventTypeMap[modulo],
      severity: AuditSeverity.CRITICAL, // Exclusões são sempre críticas
      userId,
      userEmail,
      empresaId,
      success: true,
      details: {
        entityId,
        ...details,
      },
    });
  }

  /**
   * Formata entrada de log para exibição
   */
  private formatLogEntry(entry: AuditLogEntry): string {
    const parts = [
      `[${entry.timestamp.toISOString()}]`,
      `[${entry.eventType}]`,
      `[${entry.severity}]`,
    ];

    if (entry.userId) parts.push(`User: ${entry.userId}`);
    if (entry.userEmail) parts.push(`Email: ${entry.userEmail}`);
    if (entry.empresaId) parts.push(`Empresa: ${entry.empresaId}`);
    if (entry.resource) parts.push(`Resource: ${entry.resource}`);
    if (entry.action) parts.push(`Action: ${entry.action}`);
    if (entry.ipAddress) parts.push(`IP: ${entry.ipAddress}`);
    if (entry.errorMessage) parts.push(`Error: ${entry.errorMessage}`);

    if (entry.details) {
      parts.push(`Details: ${JSON.stringify(entry.details)}`);
    }

    return parts.join(' | ');
  }

  /**
   * Registra alteração crítica de saldo inicial (CRÍTICO)
   */
  async logSaldoInicialUpdated(
    contaBancariaId: string,
    userId: string,
    userEmail: string,
    empresaId: string,
    saldoAnterior: number,
    saldoNovo: number,
    motivo?: string,
  ): Promise<void> {
    await this.log({
      timestamp: new Date(),
      eventType: AuditEventType.CONTA_BANCARIA_SALDO_INICIAL_UPDATED,
      severity: AuditSeverity.CRITICAL, // Alteração de saldo inicial é sempre crítica
      userId,
      userEmail,
      empresaId,
      success: true,
      details: {
        contaBancariaId,
        saldoAnterior,
        saldoNovo,
        diferenca: saldoNovo - saldoAnterior,
        motivo: motivo || 'Não informado',
      },
    });
  }

  /**
   * Método auxiliar para extrair IP da request
   */
  static extractIpAddress(request: any): string | undefined {
    return (
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress
    );
  }

  /**
   * Método auxiliar para extrair User Agent
   */
  static extractUserAgent(request: any): string | undefined {
    return request.headers['user-agent'];
  }
}
