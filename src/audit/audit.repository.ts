import { EntityRepository } from '@mikro-orm/postgresql';
import { Auditoria } from '../entities/auditoria/auditoria.entity';

/**
 * Repository para Auditoria
 *
 * IMPORTANTE: Este repository só permite operações de LEITURA e CRIAÇÃO
 * Não há métodos para UPDATE ou DELETE, pois registros de auditoria são IMUTÁVEIS
 */
export class AuditoriaRepository extends EntityRepository<Auditoria> {
  /**
   * Buscar logs por usuário
   */
  async findByUsuario(
    usuarioId: string,
    limit = 100,
    offset = 0,
  ): Promise<Auditoria[]> {
    return this.find(
      { usuario: usuarioId },
      {
        orderBy: { data_hora: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Buscar logs por empresa
   */
  async findByEmpresa(
    empresaId: string,
    limit = 100,
    offset = 0,
  ): Promise<Auditoria[]> {
    return this.find(
      { empresa: empresaId },
      {
        orderBy: { data_hora: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Buscar logs por módulo
   */
  async findByModulo(
    modulo: string,
    limit = 100,
    offset = 0,
  ): Promise<Auditoria[]> {
    return this.find(
      { modulo },
      {
        orderBy: { data_hora: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Buscar logs por ação
   */
  async findByAcao(
    acao: string,
    limit = 100,
    offset = 0,
  ): Promise<Auditoria[]> {
    return this.find(
      { acao },
      {
        orderBy: { data_hora: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Buscar logs por período
   */
  async findByPeriodo(
    dataInicio: Date,
    dataFim: Date,
    limit = 100,
    offset = 0,
  ): Promise<Auditoria[]> {
    return this.find(
      {
        data_hora: {
          $gte: dataInicio,
          $lte: dataFim,
        },
      },
      {
        orderBy: { data_hora: 'DESC' },
        limit,
        offset,
      },
    );
  }

  /**
   * Buscar logs com filtros combinados
   */
  async findWithFilters(filters: {
    usuarioId?: string;
    empresaId?: string;
    modulo?: string;
    acao?: string;
    resultado?: 'SUCESSO' | 'FALHA' | 'NEGADO';
    dataInicio?: Date;
    dataFim?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Auditoria[]; total: number }> {
    const where: any = {};

    if (filters.usuarioId) where.usuario = filters.usuarioId;
    if (filters.empresaId) where.empresa = filters.empresaId;
    if (filters.modulo) where.modulo = filters.modulo;
    if (filters.acao) where.acao = filters.acao;
    if (filters.resultado) where.resultado = filters.resultado;

    if (filters.dataInicio || filters.dataFim) {
      where.data_hora = {};
      if (filters.dataInicio) where.data_hora.$gte = filters.dataInicio;
      if (filters.dataFim) where.data_hora.$lte = filters.dataFim;
    }

    const [data, total] = await this.findAndCount(where, {
      orderBy: { data_hora: 'DESC' },
      limit: filters.limit || 100,
      offset: filters.offset || 0,
      populate: ['usuario', 'empresa'],
    });

    return { data, total };
  }

  /**
   * Contar logs por critério
   */
  async countByFilters(filters: {
    usuarioId?: string;
    empresaId?: string;
    modulo?: string;
    acao?: string;
    resultado?: 'SUCESSO' | 'FALHA' | 'NEGADO';
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<number> {
    const where: any = {};

    if (filters.usuarioId) where.usuario = filters.usuarioId;
    if (filters.empresaId) where.empresa = filters.empresaId;
    if (filters.modulo) where.modulo = filters.modulo;
    if (filters.acao) where.acao = filters.acao;
    if (filters.resultado) where.resultado = filters.resultado;

    if (filters.dataInicio || filters.dataFim) {
      where.data_hora = {};
      if (filters.dataInicio) where.data_hora.$gte = filters.dataInicio;
      if (filters.dataFim) where.data_hora.$lte = filters.dataFim;
    }

    return this.count(where);
  }

  /**
   * Estatísticas de auditoria
   */
  async getStatistics(filters?: {
    dataInicio?: Date;
    dataFim?: Date;
    empresaId?: string;
    usuarioId?: string;
  }): Promise<{
    total: number;
    sucesso: number;
    falha: number;
    negado: number;
    porModulo: Record<string, number>;
    porAcao: Record<string, number>;
  }> {
    const where: any = {};

    if (filters?.empresaId) where.empresa = filters.empresaId;
    if (filters?.usuarioId) where.usuario = filters.usuarioId;

    if (filters?.dataInicio || filters?.dataFim) {
      where.data_hora = {};
      if (filters.dataInicio) where.data_hora.$gte = filters.dataInicio;
      if (filters.dataFim) where.data_hora.$lte = filters.dataFim;
    }

    const [total, sucesso, falha, negado] = await Promise.all([
      this.count(where),
      this.count({ ...where, resultado: 'SUCESSO' }),
      this.count({ ...where, resultado: 'FALHA' }),
      this.count({ ...where, resultado: 'NEGADO' }),
    ]);

    // Agregar por módulo e ação
    const logs = await this.find(where, { fields: ['modulo', 'acao'] });

    const porModulo: Record<string, number> = {};
    const porAcao: Record<string, number> = {};

    logs.forEach((log) => {
      porModulo[log.modulo] = (porModulo[log.modulo] || 0) + 1;
      porAcao[log.acao] = (porAcao[log.acao] || 0) + 1;
    });

    return {
      total,
      sucesso,
      falha,
      negado,
      porModulo,
      porAcao,
    };
  }
}
