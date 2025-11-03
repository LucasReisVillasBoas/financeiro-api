import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { FilterQuery, EntityManager } from '@mikro-orm/core';
import { PlanoContasRepository } from './plano-contas.repository';
import { CreatePlanoContasDto } from './dto/create-plano-contas.dto';
import { UpdatePlanoContasDto } from './dto/update-plano-contas.dto';
import { FilterPlanoContasDto } from './dto/filter-plano-contas.dto';
import {
  PlanoContasResponseDto,
  PaginatedPlanoContasResponseDto,
} from './dto/plano-contas-response.dto';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../entities/plano-contas/plano-contas.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { AuditService } from '../audit/audit.service';
import { validarHierarquiaCodigo } from './validators/codigo-mask.validator';
import { HierarquiaValidator } from './validators/hierarquia.validator';

@Injectable()
export class PlanoContasService {
  constructor(
    @InjectRepository(PlanoContas)
    private readonly planoContasRepository: PlanoContasRepository,
    private readonly empresaService: EmpresaService,
    private readonly auditService: AuditService,
    private readonly em: EntityManager,
  ) {}

  async create(
    dto: CreatePlanoContasDto,
    userId?: string,
    userEmail?: string,
    request?: any,
  ): Promise<PlanoContas> {
    const empresa = await this.empresaService.findOne(dto.empresaId);
    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const codigoExistente = await this.planoContasRepository.findOne({
      empresa: dto.empresaId,
      codigo: dto.codigo,
      deletado_em: null,
    });

    if (codigoExistente) {
      throw new BadRequestException(
        `Já existe uma conta com o código "${dto.codigo}" nesta empresa`,
      );
    }

    let parent: PlanoContas | undefined;
    if (dto.parentId) {
      parent = await this.planoContasRepository.findOne(
        {
          id: dto.parentId,
          empresa: dto.empresaId,
          deletado_em: null,
        },
        { populate: ['empresa'] },
      );

      if (!parent) {
        throw new NotFoundException('Conta pai não encontrada');
      }

      if (parent.empresa.id !== dto.empresaId) {
        throw new BadRequestException(
          'A conta pai deve pertencer à mesma empresa',
        );
      }

      if (parent.permite_lancamento) {
        throw new BadRequestException(
          'A conta pai deve ser sintética (permite_lancamento = false)',
        );
      }

      if (dto.nivel !== parent.nivel + 1) {
        throw new BadRequestException(
          `O nível da conta filha deve ser ${parent.nivel + 1}`,
        );
      }

      HierarquiaValidator.validarTipoCompativel(parent.tipo, dto.tipo);
    } else {
      if (dto.nivel !== 1) {
        throw new BadRequestException('Contas sem pai devem ser de nível 1');
      }
    }

    const validacaoCodigo = validarHierarquiaCodigo(
      dto.codigo,
      dto.nivel,
      parent?.codigo,
    );
    if (!validacaoCodigo.valido) {
      throw new BadRequestException(validacaoCodigo.mensagem);
    }

    const { empresaId, parentId, ...dadosConta } = dto;
    const conta = this.planoContasRepository.create({
      ...dadosConta,
      empresa,
      parent,
    });

    await this.planoContasRepository.persistAndFlush(conta);

    if (userId && userEmail) {
      await this.auditService.logEntityCreated(
        'PLANO_CONTAS',
        conta.id,
        userId,
        userEmail,
        dto.empresaId,
        {
          codigo: conta.codigo,
          descricao: conta.descricao,
          tipo: conta.tipo,
          nivel: conta.nivel,
          permite_lancamento: conta.permite_lancamento,
          parentId: parent?.id,
          parentCodigo: parent?.codigo,
        },
      );
    }

    return conta;
  }

  async findAll(): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        deletado_em: null,
      },
      {
        populate: ['empresa', 'parent'],
        orderBy: { codigo: 'ASC' },
      },
    );
  }

  async search(empresaId: string, searchTerm: string): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        empresa: empresaId,
        deletado_em: null,
        $or: [
          { codigo: { $like: `%${searchTerm}%` } },
          { descricao: { $ilike: `%${searchTerm}%` } },
        ],
      },
      {
        populate: ['parent'],
        orderBy: { codigo: 'ASC' },
        limit: 20,
      },
    );
  }

  async findByEmpresa(empresaId: string): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        empresa: empresaId,
        deletado_em: null,
      },
      {
        populate: ['parent', 'filhos'],
        orderBy: { codigo: 'ASC' },
      },
    );
  }

  async findByTipo(empresaId: string, tipo: string): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        empresa: empresaId,
        tipo: tipo as TipoPlanoContas,
        deletado_em: null,
      },
      {
        populate: ['parent'],
        orderBy: { codigo: 'ASC' },
      },
    );
  }

  /**
   * Retorna a árvore completa de contas (navegação hierárquica)
   */
  async findTree(empresaId: string): Promise<PlanoContasResponseDto[]> {
    const todasContas = await this.planoContasRepository.find(
      {
        empresa: empresaId,
        deletado_em: null,
      },
      {
        populate: ['parent', 'filhos'],
        orderBy: { codigo: 'ASC' },
      },
    );

    const contasRaiz = todasContas.filter((c) => !c.parent);

    return contasRaiz.map((c) => PlanoContasResponseDto.fromEntity(c));
  }

  /**
   * Retorna os filhos diretos de uma conta
   */
  async findChildren(parentId: string): Promise<PlanoContasResponseDto[]> {
    const parent = await this.findOne(parentId);

    const filhos = await this.planoContasRepository.find(
      {
        parent: parentId,
        deletado_em: null,
      },
      {
        orderBy: { codigo: 'ASC' },
      },
    );

    return filhos.map((c) => PlanoContasResponseDto.fromEntity(c));
  }

  /**
   * Retorna o caminho completo (breadcrumb) de uma conta até a raiz
   */
  async getBreadcrumb(contaId: string): Promise<PlanoContasResponseDto[]> {
    const conta = await this.findOne(contaId);
    const breadcrumb: PlanoContas[] = [conta];

    let current = conta;
    while (current.parent) {
      const parent = await this.planoContasRepository.findOne(
        { id: current.parent.id },
        { populate: ['parent'] },
      );
      if (parent) {
        breadcrumb.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return breadcrumb.map((c) => PlanoContasResponseDto.fromEntity(c));
  }

  async findAnaliticas(empresaId: string): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        empresa: empresaId,
        permite_lancamento: true,
        deletado_em: null,
      },
      {
        orderBy: { codigo: 'ASC' },
      },
    );
  }

  async findOne(id: string): Promise<PlanoContas> {
    const conta = await this.planoContasRepository.findOne(
      {
        id,
        deletado_em: null,
      },
      {
        populate: ['empresa', 'parent', 'filhos'],
      },
    );

    if (!conta) {
      throw new NotFoundException('Conta não encontrada');
    }

    return conta;
  }

  async update(
    id: string,
    dto: UpdatePlanoContasDto,
    userId?: string,
    userEmail?: string,
    request?: any,
  ): Promise<PlanoContas> {
    const conta = await this.findOne(id);

    const valorAnterior = {
      codigo: conta.codigo,
      descricao: conta.descricao,
      tipo: conta.tipo,
      nivel: conta.nivel,
      permite_lancamento: conta.permite_lancamento,
      ativo: conta.ativo,
      parentId: conta.parent?.id,
    };

    if (dto.codigo && dto.codigo !== conta.codigo) {
      const codigoExistente = await this.planoContasRepository.findOne({
        empresa: conta.empresa.id,
        codigo: dto.codigo,
        deletado_em: null,
      });

      if (codigoExistente && codigoExistente.id !== id) {
        throw new BadRequestException(
          `Já existe uma conta com o código "${dto.codigo}" nesta empresa`,
        );
      }
    }

    if (dto.tipo && dto.tipo !== conta.tipo) {
      await HierarquiaValidator.validarAlteracaoTipo(
        this.planoContasRepository,
        conta,
        dto.tipo,
      );
    }

    if (
      dto.permite_lancamento !== undefined &&
      dto.permite_lancamento !== conta.permite_lancamento
    ) {
      const temLancamentos = false;
      HierarquiaValidator.validarAlteracaoPermiteLancamento(
        conta,
        dto.permite_lancamento,
        temLancamentos,
      );
    }

    if (dto.parentId !== undefined && dto.parentId !== conta.parent?.id) {
      await HierarquiaValidator.validarCiclo(
        this.planoContasRepository,
        id,
        dto.parentId,
      );

      if (dto.parentId) {
        const novoPai = await this.planoContasRepository.findOne(
          { id: dto.parentId, deletado_em: null },
          { populate: ['empresa'] },
        );

        if (!novoPai) {
          throw new NotFoundException('Novo pai não encontrado');
        }

        if (novoPai.empresa.id !== conta.empresa.id) {
          throw new BadRequestException(
            'Não é possível mover conta para pai de empresa diferente',
          );
        }

        HierarquiaValidator.validarTipoCompativel(
          novoPai.tipo,
          dto.tipo || conta.tipo,
        );

        if (novoPai.permite_lancamento) {
          throw new BadRequestException(
            'O novo pai deve ser uma conta sintética (permite_lancamento = false)',
          );
        }

        if (!dto.nivel || dto.nivel !== novoPai.nivel + 1) {
          dto.nivel = novoPai.nivel + 1;
        }
      } else {
        dto.nivel = 1;
      }
    }

    if (dto.nivel && dto.nivel !== conta.nivel) {
      const novoParentId =
        dto.parentId !== undefined ? dto.parentId : conta.parent?.id;
      await HierarquiaValidator.validarMovimentoConta(
        this.planoContasRepository,
        conta,
        novoParentId,
        dto.nivel,
      );
    }

    const { empresaId, parentId, ...dadosAtualizacao } = dto;

    if (parentId !== undefined) {
      if (parentId) {
        const novoPai = await this.planoContasRepository.findOne({
          id: parentId,
        });
        conta.parent = novoPai || undefined;
      } else {
        conta.parent = undefined;
      }
    }

    this.planoContasRepository.assign(conta, dadosAtualizacao);
    await this.planoContasRepository.getEntityManager().flush();

    if (userId && userEmail) {
      const valorNovo = {
        codigo: conta.codigo,
        descricao: conta.descricao,
        tipo: conta.tipo,
        nivel: conta.nivel,
        permite_lancamento: conta.permite_lancamento,
        ativo: conta.ativo,
        parentId: conta.parent?.id,
      };

      await this.auditService.logEntityUpdated(
        'PLANO_CONTAS',
        conta.id,
        userId,
        userEmail,
        conta.empresa.id,
        {
          antes: valorAnterior,
          depois: valorNovo,
          alteracoes: Object.keys(dto),
        },
      );
    }

    return conta;
  }

  async toggleStatus(
    id: string,
    novoStatus: boolean,
    userId?: string,
    userEmail?: string,
    request?: any,
  ): Promise<PlanoContas> {
    const conta = await this.findOne(id);
    const statusAnterior = conta.ativo;

    if (!novoStatus && conta.ativo) {
      if (!conta.permite_lancamento) {
        const filhosAtivos = await this.planoContasRepository.find({
          parent: id,
          ativo: true,
          deletado_em: null,
        });

        if (filhosAtivos.length > 0) {
          throw new BadRequestException(
            'Não é possível inativar uma conta sintética que possui contas filhas ativas. Inative primeiro as contas filhas.',
          );
        }
      }

      // TODO: Verificar se tem lançamentos pendentes quando implementar
    }

    conta.ativo = novoStatus;
    await this.planoContasRepository.persistAndFlush(conta);

    if (userId && userEmail) {
      await this.auditService.log({
        timestamp: new Date(),
        eventType: 'PLANO_CONTAS_STATUS_CHANGED' as any,
        severity: 'INFO' as any,
        userId,
        userEmail,
        empresaId: conta.empresa.id,
        success: true,
        details: {
          contaId: conta.id,
          codigo: conta.codigo,
          descricao: conta.descricao,
          statusAnterior,
          statusNovo: novoStatus,
          acao: novoStatus ? 'reativação' : 'inativação',
        },
      });
    }

    return conta;
  }

  /**
   * Verifica se uma conta do plano de contas está sendo usada em lançamentos
   * @param contaId ID da conta a verificar
   * @returns Objeto com informação de uso e contadores por módulo
   */
  async verificarContaEmUso(contaId: string): Promise<{
    emUso: boolean;
    contasPagar: number;
    contasReceber: number;
    movimentacoes: number;
    total: number;
    detalhes?: string;
  }> {
    const contaPagar = await this.em.count('ContasPagar', {
      planoContas: contaId,
      deletadoEm: null,
    });

    const contaReceber = await this.em.count('ContasReceber', {
      planoContas: contaId,
      deletadoEm: null,
    });

    const movimentacoes = await this.em.count('MovimentacoesBancarias', {
      planoContas: contaId,
      deletadoEm: null,
    });

    const total = contaPagar + contaReceber + movimentacoes;
    const emUso = total > 0;

    const detalhes: string[] = [];
    if (contaPagar > 0) detalhes.push(`${contaPagar} conta(s) a pagar`);
    if (contaReceber > 0) detalhes.push(`${contaReceber} conta(s) a receber`);
    if (movimentacoes > 0) detalhes.push(`${movimentacoes} movimentação(ões)`);

    return {
      emUso,
      contasPagar: contaPagar,
      contasReceber: contaReceber,
      movimentacoes,
      total,
      detalhes: detalhes.length > 0 ? detalhes.join(', ') : undefined,
    };
  }

  /**
   * Substitui uma conta por outra em todos os lançamentos (merge)
   * @param contaOrigemId ID da conta a ser substituída
   * @param contaDestinoId ID da conta que substituirá
   * @param userId ID do usuário que está fazendo a operação
   * @param userEmail Email do usuário
   * @returns Objeto com resultado da operação
   */
  async substituirConta(
    contaOrigemId: string,
    contaDestinoId: string,
    userId: string,
    userEmail: string,
  ): Promise<{
    sucesso: boolean;
    contasAtualizadas: number;
    detalhes: {
      contasPagar: number;
      contasReceber: number;
      movimentacoes: number;
    };
  }> {
    const contaOrigem = await this.findOne(contaOrigemId);
    const contaDestino = await this.findOne(contaDestinoId);

    if (!contaDestino.permite_lancamento) {
      throw new BadRequestException(
        'A conta destino deve ser uma conta analítica (permite lançamento)',
      );
    }

    if (!contaDestino.ativo) {
      throw new BadRequestException('A conta destino deve estar ativa');
    }

    if (contaOrigem.empresa.id !== contaDestino.empresa.id) {
      throw new BadRequestException(
        'As contas devem pertencer à mesma empresa',
      );
    }

    if (contaOrigemId === contaDestinoId) {
      throw new BadRequestException(
        'A conta origem e destino não podem ser a mesma',
      );
    }

    const connection = this.em.getConnection();
    let contasPagar = 0;
    let contasReceber = 0;
    let movimentacoes = 0;

    try {
      const resultPagar = await connection.execute(
        `UPDATE contas_pagar
         SET plano_contas_id = ?
         WHERE plano_contas_id = ? AND deletado_em IS NULL`,
        [contaDestinoId, contaOrigemId],
      );
      contasPagar = resultPagar.affectedRows || 0;

      const resultReceber = await connection.execute(
        `UPDATE contas_receber
         SET plano_contas_id = ?
         WHERE plano_contas_id = ? AND deletado_em IS NULL`,
        [contaDestinoId, contaOrigemId],
      );
      contasReceber = resultReceber.affectedRows || 0;

      const resultMovimentacoes = await connection.execute(
        `UPDATE movimentacoes_bancarias
         SET plano_contas_id = ?
         WHERE plano_contas_id = ? AND deletado_em IS NULL`,
        [contaDestinoId, contaOrigemId],
      );
      movimentacoes = resultMovimentacoes.affectedRows || 0;

      const total = contasPagar + contasReceber + movimentacoes;

      await this.auditService.log({
        timestamp: new Date(),
        eventType: 'PLANO_CONTAS_UPDATED' as any,
        severity: 'CRITICAL' as any,
        userId,
        userEmail,
        empresaId: contaOrigem.empresa.id,
        success: true,
        details: {
          acao: 'SUBSTITUICAO_CONTA',
          contaOrigemId: contaOrigem.id,
          contaOrigemCodigo: contaOrigem.codigo,
          contaOrigemDescricao: contaOrigem.descricao,
          contaDestinoId: contaDestino.id,
          contaDestinoCodigo: contaDestino.codigo,
          contaDestinoDescricao: contaDestino.descricao,
          lancamentosAtualizados: total,
          detalhamento: {
            contasPagar,
            contasReceber,
            movimentacoes,
          },
        },
      });

      return {
        sucesso: true,
        contasAtualizadas: total,
        detalhes: {
          contasPagar,
          contasReceber,
          movimentacoes,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao substituir conta: ${error.message}`,
      );
    }
  }

  /**
   * Retorna apenas contas analíticas ativas (para uso em seletores de lançamento)
   */
  async findAnaliticasAtivas(empresaId: string): Promise<PlanoContas[]> {
    return await this.planoContasRepository.find(
      {
        empresa: empresaId,
        permite_lancamento: true,
        ativo: true,
        deletado_em: null,
      },
      {
        populate: ['parent'],
        orderBy: { codigo: 'ASC' },
      },
    );
  }

  async softDelete(
    id: string,
    userId?: string,
    userEmail?: string,
    request?: any,
  ): Promise<void> {
    const conta = await this.findOne(id);

    const filhosAtivos = await this.planoContasRepository.find({
      parent: id,
      deletado_em: null,
    });

    if (filhosAtivos.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma conta que possui contas filhas',
      );
    }

    const uso = await this.verificarContaEmUso(id);
    if (uso.emUso) {
      throw new BadRequestException(
        `Não é possível excluir esta conta pois ela está sendo usada em ${uso.total} lançamento(s): ${uso.detalhes}. ` +
          `Para excluir esta conta, primeiro substitua-a por outra usando a funcionalidade de merge/substituição.`,
      );
    }

    conta.deletado_em = new Date();
    conta.ativo = false;
    await this.planoContasRepository.persistAndFlush(conta);

    if (userId && userEmail) {
      await this.auditService.logEntityDeleted(
        'PLANO_CONTAS',
        conta.id,
        userId,
        userEmail,
        conta.empresa.id,
        {
          codigo: conta.codigo,
          descricao: conta.descricao,
          tipo: conta.tipo,
          nivel: conta.nivel,
          permite_lancamento: conta.permite_lancamento,
          ativo: conta.ativo,
        },
      );
    }
  }
}
