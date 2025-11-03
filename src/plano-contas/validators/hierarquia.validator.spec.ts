import { BadRequestException } from '@nestjs/common';
import { HierarquiaValidator } from './hierarquia.validator';
import { PlanoContas, TipoPlanoContas } from '../../entities/plano-contas/plano-contas.entity';
import { PlanoContasRepository } from '../plano-contas.repository';

describe('HierarquiaValidator', () => {
  let mockRepository: jest.Mocked<PlanoContasRepository>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validarCiclo', () => {
    it('deve lançar erro se conta for pai de si mesma', async () => {
      const contaId = 'conta-123';
      const parentId = 'conta-123';

      await expect(
        HierarquiaValidator.validarCiclo(mockRepository, contaId, parentId),
      ).rejects.toThrow('Uma conta não pode ser pai de si mesma');
    });

    it('deve lançar erro se detectar ciclo na cadeia de pais', async () => {
      const contaA = 'conta-a';
      const contaB = 'conta-b';
      const contaC = 'conta-c';

      // Setup: A -> B -> C, tentando fazer C -> A (ciclo)
      mockRepository.findOne
        .mockResolvedValueOnce({
          id: contaA,
          parent: { id: contaB },
        } as any)
        .mockResolvedValueOnce({
          id: contaB,
          parent: { id: contaC },
        } as any);

      await expect(
        HierarquiaValidator.validarCiclo(mockRepository, contaC, contaA),
      ).rejects.toThrow('Não é possível criar um ciclo na hierarquia');
    });

    it('deve passar se não houver ciclo', async () => {
      const contaId = 'conta-123';
      const parentId = 'conta-456';

      mockRepository.findOne.mockResolvedValueOnce({
        id: parentId,
        parent: undefined,
      } as any);

      await expect(
        HierarquiaValidator.validarCiclo(mockRepository, contaId, parentId),
      ).resolves.not.toThrow();
    });

    it('deve passar se parentId for undefined', async () => {
      const contaId = 'conta-123';

      await expect(
        HierarquiaValidator.validarCiclo(mockRepository, contaId, undefined),
      ).resolves.not.toThrow();
    });
  });

  describe('validarTipoCompativel', () => {
    it('deve passar se tipos forem iguais', () => {
      expect(() => {
        HierarquiaValidator.validarTipoCompativel(
          TipoPlanoContas.RECEITA,
          TipoPlanoContas.RECEITA,
        );
      }).not.toThrow();
    });

    it('deve lançar erro se tipos forem diferentes', () => {
      expect(() => {
        HierarquiaValidator.validarTipoCompativel(
          TipoPlanoContas.RECEITA,
          TipoPlanoContas.DESPESA,
        );
      }).toThrow('Conta filha deve ter o mesmo tipo do pai');
    });
  });

  describe('validarAlteracaoTipo', () => {
    it('deve lançar erro se tipo não for compatível com pai', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        parent: { id: 'pai-123' } as any,
        filhos: { isInitialized: () => false } as any,
      };

      mockRepository.findOne.mockResolvedValueOnce({
        id: 'pai-123',
        tipo: TipoPlanoContas.DESPESA,
      } as any);

      await expect(
        HierarquiaValidator.validarAlteracaoTipo(
          mockRepository,
          conta as PlanoContas,
          TipoPlanoContas.CUSTO,
        ),
      ).rejects.toThrow('conta filha deve manter o mesmo tipo do pai');
    });

    it('deve lançar erro se filhos tiverem tipo diferente', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        parent: undefined,
        filhos: {
          isInitialized: () => true,
          getItems: () => [
            { codigo: '1.1', tipo: TipoPlanoContas.RECEITA },
            { codigo: '1.2', tipo: TipoPlanoContas.RECEITA },
          ],
        } as any,
      };

      await expect(
        HierarquiaValidator.validarAlteracaoTipo(
          mockRepository,
          conta as PlanoContas,
          TipoPlanoContas.DESPESA,
        ),
      ).rejects.toThrow('conta possui filhos com tipo diferente');
    });

    it('deve passar se não houver pai nem filhos', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        parent: undefined,
        filhos: { isInitialized: () => false } as any,
      };

      await expect(
        HierarquiaValidator.validarAlteracaoTipo(
          mockRepository,
          conta as PlanoContas,
          TipoPlanoContas.DESPESA,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('validarAlteracaoPermiteLancamento', () => {
    it('deve lançar erro ao tornar analítica conta com filhos', () => {
      const conta: Partial<PlanoContas> = {
        permite_lancamento: false,
        filhos: { length: 2 } as any,
      };

      expect(() => {
        HierarquiaValidator.validarAlteracaoPermiteLancamento(
          conta as PlanoContas,
          true,
          false,
        );
      }).toThrow('Não é possível tornar analítica uma conta que possui contas filhas');
    });

    it('deve lançar erro ao alterar permite_lancamento com lançamentos', () => {
      const conta: Partial<PlanoContas> = {
        permite_lancamento: true,
        filhos: { length: 0 } as any,
      };

      expect(() => {
        HierarquiaValidator.validarAlteracaoPermiteLancamento(
          conta as PlanoContas,
          false,
          true, // tem lançamentos
        );
      }).toThrow('Não é possível alterar permite_lancamento de uma conta que possui lançamentos');
    });

    it('deve lançar erro ao tornar sintética conta com lançamentos', () => {
      const conta: Partial<PlanoContas> = {
        permite_lancamento: true,
        filhos: { length: 0 } as any,
      };

      expect(() => {
        HierarquiaValidator.validarAlteracaoPermiteLancamento(
          conta as PlanoContas,
          false,
          true, // tem lançamentos
        );
      }).toThrow('Não é possível alterar permite_lancamento de uma conta que possui lançamentos');
    });

    it('deve passar se não houver filhos nem lançamentos', () => {
      const conta: Partial<PlanoContas> = {
        permite_lancamento: false,
        filhos: { length: 0 } as any,
      };

      expect(() => {
        HierarquiaValidator.validarAlteracaoPermiteLancamento(
          conta as PlanoContas,
          true,
          false,
        );
      }).not.toThrow();
    });
  });

  describe('validarMovimentoConta', () => {
    it('deve lançar erro ao mover para pai de empresa diferente', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-1' } as any,
        filhos: { isInitialized: () => false } as any,
      };

      const novoPai = {
        id: 'novo-pai',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-2' },
        permite_lancamento: false,
        nivel: 1,
      };

      // validarCiclo chamará findOne para verificar ciclo (retorna null = sem parent)
      mockRepository.findOne
        .mockResolvedValueOnce(null) // Para validarCiclo
        .mockResolvedValueOnce(novoPai as any); // Para o novo pai

      await expect(
        HierarquiaValidator.validarMovimentoConta(
          mockRepository,
          conta as PlanoContas,
          'novo-pai',
          2,
        ),
      ).rejects.toThrow('Não é possível mover conta para pai de empresa diferente');
    });

    it('deve lançar erro se novo pai for analítico', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-1' } as any,
        filhos: { isInitialized: () => false } as any,
      };

      const novoPai = {
        id: 'novo-pai',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-1' },
        permite_lancamento: true, // Analítico
        nivel: 1,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // Para validarCiclo
        .mockResolvedValueOnce(novoPai as any); // Para o novo pai

      await expect(
        HierarquiaValidator.validarMovimentoConta(
          mockRepository,
          conta as PlanoContas,
          'novo-pai',
          2,
        ),
      ).rejects.toThrow('O novo pai deve ser uma conta sintética');
    });

    it('deve lançar erro se nível for incorreto', async () => {
      const conta: Partial<PlanoContas> = {
        id: 'conta-123',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-1' } as any,
        filhos: { isInitialized: () => false } as any,
      };

      const novoPai = {
        id: 'novo-pai',
        tipo: TipoPlanoContas.RECEITA,
        empresa: { id: 'empresa-1' },
        permite_lancamento: false,
        nivel: 1,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(null) // Para validarCiclo
        .mockResolvedValueOnce(novoPai as any); // Para o novo pai

      await expect(
        HierarquiaValidator.validarMovimentoConta(
          mockRepository,
          conta as PlanoContas,
          'novo-pai',
          5, // Nível errado (deveria ser 2)
        ),
      ).rejects.toThrow('Nível deve ser 2 para ser filho desta conta');
    });
  });
});
