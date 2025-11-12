import { BadRequestException } from '@nestjs/common';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../../entities/plano-contas/plano-contas.entity';
import { PlanoContasRepository } from '../plano-contas.repository';

/**
 * Validações avançadas de hierarquia para Plano de Contas
 */
export class HierarquiaValidator {
  /**
   * Verifica se há ciclo na hierarquia (conta não pode ser pai de si mesma)
   * Percorre recursivamente os ancestrais para detectar ciclos
   */
  static async validarCiclo(
    repository: PlanoContasRepository,
    contaId: string,
    novoParentId?: string,
  ): Promise<void> {
    if (!novoParentId) return; // Sem pai, não há risco de ciclo

    // Conta não pode ser pai de si mesma
    if (contaId === novoParentId) {
      throw new BadRequestException('Uma conta não pode ser pai de si mesma');
    }

    // Percorrer ancestrais do novo pai para verificar se a conta aparece
    let currentParentId: string | undefined = novoParentId;
    const visitados = new Set<string>([contaId]);

    while (currentParentId) {
      // Se encontrarmos a conta na cadeia de pais, há um ciclo
      if (visitados.has(currentParentId)) {
        throw new BadRequestException(
          'Não é possível criar um ciclo na hierarquia. Esta operação faria a conta ser ancestral de si mesma.',
        );
      }

      visitados.add(currentParentId);

      // Buscar próximo pai na cadeia
      const parent = await repository.findOne(
        { id: currentParentId },
        { populate: ['parent'] },
      );

      if (!parent) break;
      currentParentId = parent.parent?.id;
    }
  }

  /**
   * Valida se o tipo do filho é compatível com o tipo do pai
   * Regra: Filho deve ter o mesmo tipo do pai (herança de tipo)
   */
  static validarTipoCompativel(
    tipoPai: TipoPlanoContas,
    tipoFilho: TipoPlanoContas,
  ): void {
    if (tipoPai !== tipoFilho) {
      throw new BadRequestException(
        `Conta filha deve ter o mesmo tipo do pai. Tipo do pai: ${tipoPai}, Tipo da filha: ${tipoFilho}`,
      );
    }
  }

  /**
   * Valida se pode mover uma conta para outro pai
   * Verifica:
   * 1. Não cria ciclo
   * 2. Tipos compatíveis
   * 3. Nível correto
   * 4. Integridade dos filhos (todos mantém compatibilidade de tipo)
   */
  static async validarMovimentoConta(
    repository: PlanoContasRepository,
    conta: PlanoContas,
    novoParentId: string | undefined,
    novoNivel: number,
  ): Promise<void> {
    // Validar ciclo
    await this.validarCiclo(repository, conta.id, novoParentId);

    // Se tem novo pai
    if (novoParentId) {
      const novoPai = await repository.findOne(
        { id: novoParentId },
        { populate: ['empresa'] },
      );

      if (!novoPai) {
        throw new BadRequestException('Novo pai não encontrado');
      }

      // Validar empresa
      if (novoPai.empresa.id !== conta.empresa.id) {
        throw new BadRequestException(
          'Não é possível mover conta para pai de empresa diferente',
        );
      }

      // Validar tipo compatível
      this.validarTipoCompativel(novoPai.tipo, conta.tipo);

      // Validar que pai é sintético
      if (novoPai.permite_lancamento) {
        throw new BadRequestException(
          'O novo pai deve ser uma conta sintética (permite_lancamento = false)',
        );
      }

      // Validar nível
      if (novoNivel !== novoPai.nivel + 1) {
        throw new BadRequestException(
          `Nível deve ser ${novoPai.nivel + 1} para ser filho desta conta`,
        );
      }
    } else {
      // Sem pai = nível 1
      if (novoNivel !== 1) {
        throw new BadRequestException('Conta sem pai deve ser nível 1');
      }
    }

    // Validar filhos mantêm compatibilidade
    if (conta.filhos && conta.filhos.isInitialized()) {
      const filhos = conta.filhos.getItems();
      for (const filho of filhos) {
        // Todos os filhos devem ter tipo compatível
        if (filho.tipo !== conta.tipo) {
          throw new BadRequestException(
            `Não é possível mover: conta possui filhos com tipo diferente (${filho.codigo} é ${filho.tipo})`,
          );
        }
      }
    }
  }

  /**
   * Valida se pode alterar o tipo de uma conta
   * Verifica:
   * 1. Se tem filhos, todos devem ter o mesmo tipo
   * 2. Se tem pai, deve ser compatível com o pai
   */
  static async validarAlteracaoTipo(
    repository: PlanoContasRepository,
    conta: PlanoContas,
    novoTipo: TipoPlanoContas,
  ): Promise<void> {
    // Se tem pai, validar compatibilidade
    if (conta.parent) {
      const pai = await repository.findOne(
        { id: conta.parent.id },
        { populate: ['parent'] },
      );

      if (pai && pai.tipo !== novoTipo) {
        throw new BadRequestException(
          `Não é possível alterar tipo: conta filha deve manter o mesmo tipo do pai (${pai.tipo})`,
        );
      }
    }

    // Se tem filhos, todos devem ter tipo compatível com o novo tipo
    if (conta.filhos && conta.filhos.isInitialized()) {
      const filhos = conta.filhos.getItems();
      const filhosIncompativeis = filhos.filter((f) => f.tipo !== novoTipo);

      if (filhosIncompativeis.length > 0) {
        const codigos = filhosIncompativeis.map((f) => f.codigo).join(', ');
        throw new BadRequestException(
          `Não é possível alterar tipo: conta possui filhos com tipo diferente (${codigos})`,
        );
      }
    }
  }

  /**
   * Valida se pode alterar permite_lancamento
   * Bloqueia se:
   * 1. Tem filhos e quer tornar analítica
   * 2. Tem lançamentos e quer mudar (quando implementar lançamentos)
   */
  static validarAlteracaoPermiteLancamento(
    conta: PlanoContas,
    novoPermiteLancamento: boolean,
    temLancamentos: boolean = false,
  ): void {
    // Se quer tornar analítica mas tem filhos
    if (novoPermiteLancamento === true && conta.filhos?.length > 0) {
      throw new BadRequestException(
        'Não é possível tornar analítica uma conta que possui contas filhas',
      );
    }

    // Se tem lançamentos, não pode alterar
    if (temLancamentos && conta.permite_lancamento !== novoPermiteLancamento) {
      throw new BadRequestException(
        'Não é possível alterar permite_lancamento de uma conta que possui lançamentos associados',
      );
    }

    // Se quer tornar sintética mas tem lançamentos
    if (
      novoPermiteLancamento === false &&
      conta.permite_lancamento === true &&
      temLancamentos
    ) {
      throw new BadRequestException(
        'Não é possível tornar sintética uma conta que possui lançamentos',
      );
    }
  }

  /**
   * Valida integridade completa da árvore ao criar/atualizar
   */
  static async validarIntegridade(
    repository: PlanoContasRepository,
    conta: PlanoContas,
    parentId?: string,
    novoTipo?: TipoPlanoContas,
    novoNivel?: number,
  ): Promise<void> {
    // Validar ciclo se mudando parent
    if (parentId !== undefined && parentId !== conta.parent?.id) {
      await this.validarCiclo(repository, conta.id, parentId);
    }

    // Validar tipo se mudando
    if (novoTipo && novoTipo !== conta.tipo) {
      await this.validarAlteracaoTipo(repository, conta, novoTipo);
    }

    // Validar movimento se mudando parent ou nível
    if (
      (parentId !== undefined && parentId !== conta.parent?.id) ||
      (novoNivel !== undefined && novoNivel !== conta.nivel)
    ) {
      await this.validarMovimentoConta(
        repository,
        conta,
        parentId,
        novoNivel || conta.nivel,
      );
    }
  }
}
