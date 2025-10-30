import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { Usuario } from '../usuario/usuario.entity';
import { Empresa } from '../empresa/empresa.entity';
import { AuditoriaRepository } from '../../audit/audit.repository';

/**
 * Entidade de Auditoria - Registros IMUTÁVEIS de ações no sistema
 *
 * Armazena logs de:
 * - Login/Logout
 * - Exclusão de registros
 * - Alterações críticas
 * - Cadastros sensíveis
 */
@Entity({ repository: () => AuditoriaRepository })
export class Auditoria {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Usuário que executou a ação
   */
  @ManyToOne(() => Usuario, { nullable: true, fieldName: 'usuario_id' })
  @Index()
  usuario?: Usuario;

  /**
   * Ação executada
   * Ex: LOGIN, LOGOUT, CREATE, UPDATE, DELETE
   */
  @Property({ length: 50 })
  acao: string;

  /**
   * Módulo/Recurso afetado
   * Ex: AUTH, USUARIO, EMPRESA, FINANCEIRO, CONTA
   */
  @Property({ length: 100 })
  modulo: string;

  /**
   * Empresa relacionada à ação (quando aplicável)
   * Pode ser tanto sede quanto filial
   */
  @ManyToOne(() => Empresa, { nullable: true, fieldName: 'empresa_id' })
  @Index()
  empresa?: Empresa;

  /**
   * Data e hora da ação
   */
  @Property({ type: 'timestamp' })
  @Index()
  data_hora: Date = new Date();

  /**
   * Resultado da ação
   * Ex: SUCESSO, FALHA, NEGADO
   */
  @Property({ length: 20 })
  resultado: 'SUCESSO' | 'FALHA' | 'NEGADO';

  /**
   * Endereço IP de onde a ação foi executada
   */
  @Property({ type: 'string', nullable: true, length: 45 })
  ip_address?: string;

  /**
   * User Agent do navegador/cliente
   */
  @Property({ type: 'text', nullable: true })
  user_agent?: string;

  /**
   * Detalhes adicionais da ação em formato JSON
   * Ex: campos alterados, valores anteriores, motivo da falha
   */
  @Property({ type: 'jsonb', nullable: true })
  detalhes?: Record<string, any>;

  /**
   * Mensagem de erro (quando resultado = FALHA)
   */
  @Property({ type: 'text', nullable: true })
  mensagem_erro?: string;

  /**
   * Registro imutável - não pode ser alterado após criação
   * Este campo é informativo, a proteção real é implementada no service
   */
  @Property({ persist: false })
  readonly imutavel: boolean = true;
}
