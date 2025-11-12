import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { PlanoContasService } from '../../src/plano-contas/plano-contas.service';
import { PlanoContasRepository } from '../../src/plano-contas/plano-contas.repository';
import { EmpresaService } from '../../src/empresa/empresa.service';
import { AuditService } from '../../src/audit/audit.service';
import { EntityManager } from '@mikro-orm/core';
import {
  PlanoContas,
  TipoPlanoContas,
} from '../../src/entities/plano-contas/plano-contas.entity';
import { CreatePlanoContasDto } from '../../src/plano-contas/dto/create-plano-contas.dto';

describe('PlanoContasService', () => {
  let service: PlanoContasService;
  let repository: PlanoContasRepository;
  let empresaService: EmpresaService;
  let auditService: AuditService;
  let entityManager: EntityManager;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    persistAndFlush: jest.fn(),
    assign: jest.fn(),
    getEntityManager: jest.fn(() => ({
      flush: jest.fn(),
    })),
  };

  const mockEmpresaService = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
    logEntityCreated: jest.fn(),
    logEntityUpdated: jest.fn(),
    logEntityDeleted: jest.fn(),
  };

  const mockEntityManager = {
    count: jest.fn(),
    getConnection: jest.fn(() => ({
      execute: jest.fn(),
    })),
  };

  const mockEmpresa = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    nome: 'Empresa Teste',
  };

  const mockPlanoContas: Partial<PlanoContas> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    codigo: '1',
    descricao: 'Receitas',
    tipo: TipoPlanoContas.RECEITA,
    nivel: 1,
    permite_lancamento: false,
    ativo: true,
    empresa: mockEmpresa as any,
    filhos: {
      length: 0,
      isInitialized: () => false,
      getItems: () => [],
    } as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanoContasService,
        {
          provide: getRepositoryToken(PlanoContas),
          useValue: mockRepository,
        },
        {
          provide: EmpresaService,
          useValue: mockEmpresaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<PlanoContasService>(PlanoContasService);
    repository = module.get(getRepositoryToken(PlanoContas));
    empresaService = module.get<EmpresaService>(EmpresaService);
    auditService = module.get<AuditService>(AuditService);
    entityManager = module.get<EntityManager>(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePlanoContasDto = {
      empresaId: mockEmpresa.id,
      codigo: '1',
      descricao: 'Receitas',
      tipo: TipoPlanoContas.RECEITA,
      nivel: 1,
      permite_lancamento: false,
    };

    it('deve criar uma conta raiz com sucesso', async () => {
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockRepository.findOne.mockResolvedValue(null); // Código não existe
      mockRepository.create.mockReturnValue(mockPlanoContas);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPlanoContas);
      expect(empresaService.findOne).toHaveBeenCalledWith(mockEmpresa.id);
      expect(repository.findOne).toHaveBeenCalledWith({
        empresa: mockEmpresa.id,
        codigo: '1',
        deletado_em: null,
      });
    });

    it('deve lançar erro se empresa não existir', async () => {
      mockEmpresaService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Empresa não encontrada',
      );
    });

    it('deve lançar erro se código já existir', async () => {
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockRepository.findOne.mockResolvedValue(mockPlanoContas); // Código já existe

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Já existe uma conta com o código',
      );
    });

    it('deve lançar erro se conta sem pai não for nível 1', async () => {
      const invalidDto = { ...createDto, nivel: 2 };
      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Contas sem pai devem ser de nível 1',
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma conta por id', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);

      const result = await service.findOne(mockPlanoContas.id as string);

      expect(result).toEqual(mockPlanoContas);
      expect(repository.findOne).toHaveBeenCalledWith(
        { id: mockPlanoContas.id, deletado_em: null },
        { populate: ['empresa', 'parent', 'filhos'] },
      );
    });

    it('deve lançar NotFoundException se conta não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('id-invalido')).rejects.toThrow(
        'Conta não encontrada',
      );
    });
  });

  describe('toggleStatus', () => {
    it('deve inativar uma conta analítica', async () => {
      const contaAnalitica = { ...mockPlanoContas, permite_lancamento: true };
      mockRepository.findOne.mockResolvedValue(contaAnalitica);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.toggleStatus(
        contaAnalitica.id as string,
        false,
      );

      expect(result.ativo).toBe(false);
      expect(repository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve impedir inativação de conta sintética com filhos ativos', async () => {
      const contaSintetica = {
        ...mockPlanoContas,
        permite_lancamento: false,
        ativo: true,
      };
      const filhoAtivo = { ...mockPlanoContas, id: 'filho-id', ativo: true };

      mockRepository.findOne
        .mockResolvedValueOnce(contaSintetica) // findOne para toggleStatus
        .mockResolvedValueOnce({ ...contaSintetica, filhos: { length: 1 } }); // findOne interno

      mockRepository.find.mockResolvedValue([filhoAtivo]);

      await expect(
        service.toggleStatus(contaSintetica.id as string, false),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.toggleStatus(contaSintetica.id as string, false),
      ).rejects.toThrow('Inative primeiro as contas filhas');
    });

    it('deve reativar uma conta', async () => {
      const contaInativa = { ...mockPlanoContas, ativo: false };
      mockRepository.findOne.mockResolvedValue(contaInativa);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.toggleStatus(
        contaInativa.id as string,
        true,
      );

      expect(result.ativo).toBe(true);
      expect(repository.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar a descrição de uma conta', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);
      mockRepository.assign.mockImplementation((conta, data) => {
        Object.assign(conta, data);
      });
      mockRepository.getEntityManager().flush.mockResolvedValue(undefined);

      const updateDto = { descricao: 'Nova Descrição' };
      const result = await service.update(
        mockPlanoContas.id as string,
        updateDto,
      );

      expect(repository.assign).toHaveBeenCalledWith(
        mockPlanoContas,
        expect.objectContaining({ descricao: 'Nova Descrição' }),
      );
    });

    it('deve impedir tornar analítica uma conta com filhos', async () => {
      const contaComFilhos = {
        ...mockPlanoContas,
        permite_lancamento: false,
        filhos: {
          length: 2,
          isInitialized: () => true,
          getItems: () => [{}, {}],
        } as any,
      };
      mockRepository.findOne.mockResolvedValue(contaComFilhos);

      const updateDto = { permite_lancamento: true };
      await expect(
        service.update(contaComFilhos.id as string, updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(contaComFilhos.id as string, updateDto),
      ).rejects.toThrow(
        'Não é possível tornar analítica uma conta que possui contas filhas',
      );
    });
  });

  describe('softDelete', () => {
    it('deve excluir uma conta sem filhos e sem uso', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);
      mockRepository.find.mockResolvedValue([]); // Sem filhos
      mockEntityManager.count.mockResolvedValue(0); // Sem uso
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      await service.softDelete(mockPlanoContas.id as string);

      expect(mockPlanoContas.deletado_em).toBeDefined();
      expect(mockPlanoContas.ativo).toBe(false);
      expect(repository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve impedir exclusão de conta com filhos ativos', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);
      mockRepository.find.mockResolvedValue([{ id: 'filho' }]); // Com filhos

      await expect(
        service.softDelete(mockPlanoContas.id as string),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.softDelete(mockPlanoContas.id as string),
      ).rejects.toThrow(
        'Não é possível excluir uma conta que possui contas filhas',
      );
    });

    it('deve impedir exclusão de conta em uso', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);
      mockRepository.find.mockResolvedValue([]); // Sem filhos
      mockEntityManager.count
        .mockResolvedValueOnce(5) // 5 contas a pagar
        .mockResolvedValueOnce(0) // 0 contas a receber
        .mockResolvedValueOnce(0); // 0 movimentações

      await expect(
        service.softDelete(mockPlanoContas.id as string),
      ).rejects.toThrow(BadRequestException);

      // Reset mocks e simular novamente para segundo expect
      mockRepository.findOne.mockResolvedValue(mockPlanoContas);
      mockRepository.find.mockResolvedValue([]);
      mockEntityManager.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await expect(
        service.softDelete(mockPlanoContas.id as string),
      ).rejects.toThrow('está sendo usada em 5 lançamento(s)');
    });
  });

  describe('verificarContaEmUso', () => {
    it('deve retornar false quando conta não está em uso', async () => {
      mockEntityManager.count
        .mockResolvedValueOnce(0) // Contas a pagar
        .mockResolvedValueOnce(0) // Contas a receber
        .mockResolvedValueOnce(0); // Movimentações

      const result = await service.verificarContaEmUso('conta-id');

      expect(result.emUso).toBe(false);
      expect(result.total).toBe(0);
      expect(result.contasPagar).toBe(0);
      expect(result.contasReceber).toBe(0);
      expect(result.movimentacoes).toBe(0);
    });

    it('deve retornar true e detalhamento quando conta está em uso', async () => {
      mockEntityManager.count
        .mockResolvedValueOnce(3) // Contas a pagar
        .mockResolvedValueOnce(2) // Contas a receber
        .mockResolvedValueOnce(5); // Movimentações

      const result = await service.verificarContaEmUso('conta-id');

      expect(result.emUso).toBe(true);
      expect(result.total).toBe(10);
      expect(result.contasPagar).toBe(3);
      expect(result.contasReceber).toBe(2);
      expect(result.movimentacoes).toBe(5);
      expect(result.detalhes).toContain('3 conta(s) a pagar');
      expect(result.detalhes).toContain('2 conta(s) a receber');
      expect(result.detalhes).toContain('5 movimentação(ões)');
    });
  });

  describe('substituirConta', () => {
    const contaOrigem: Partial<PlanoContas> = {
      id: 'origem-id',
      codigo: '1.1',
      descricao: 'Conta Origem',
      permite_lancamento: true,
      ativo: true,
      empresa: mockEmpresa as any,
    };

    const contaDestino: Partial<PlanoContas> = {
      id: 'destino-id',
      codigo: '1.2',
      descricao: 'Conta Destino',
      permite_lancamento: true,
      ativo: true,
      empresa: mockEmpresa as any,
    };

    it('deve substituir conta com sucesso', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(contaOrigem)
        .mockResolvedValueOnce(contaDestino);

      const mockConnection = {
        execute: jest
          .fn()
          .mockResolvedValueOnce({ affectedRows: 3 }) // Contas a pagar
          .mockResolvedValueOnce({ affectedRows: 2 }) // Contas a receber
          .mockResolvedValueOnce({ affectedRows: 1 }), // Movimentações
      };
      mockEntityManager.getConnection.mockReturnValue(mockConnection);

      const result = await service.substituirConta(
        'origem-id',
        'destino-id',
        'user-id',
        'user@test.com',
      );

      expect(result.sucesso).toBe(true);
      expect(result.contasAtualizadas).toBe(6);
      expect(result.detalhes.contasPagar).toBe(3);
      expect(result.detalhes.contasReceber).toBe(2);
      expect(result.detalhes.movimentacoes).toBe(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'PLANO_CONTAS_UPDATED',
          severity: 'CRITICAL',
        }),
      );
    });

    it('deve lançar erro se conta destino não for analítica', async () => {
      const contaDestinoSintetica = {
        ...contaDestino,
        permite_lancamento: false,
      };
      mockRepository.findOne
        .mockResolvedValueOnce(contaOrigem)
        .mockResolvedValueOnce(contaDestinoSintetica);

      await expect(
        service.substituirConta(
          'origem-id',
          'destino-id',
          'user-id',
          'user@test.com',
        ),
      ).rejects.toThrow('A conta destino deve ser uma conta analítica');
    });

    it('deve lançar erro se conta destino não estiver ativa', async () => {
      const contaDestinoInativa = { ...contaDestino, ativo: false };
      mockRepository.findOne
        .mockResolvedValueOnce(contaOrigem)
        .mockResolvedValueOnce(contaDestinoInativa);

      await expect(
        service.substituirConta(
          'origem-id',
          'destino-id',
          'user-id',
          'user@test.com',
        ),
      ).rejects.toThrow('A conta destino deve estar ativa');
    });

    it('deve lançar erro se contas forem de empresas diferentes', async () => {
      const empresaDiferente = { ...mockEmpresa, id: 'empresa-diferente' };
      const contaDestinoOutraEmpresa = {
        ...contaDestino,
        empresa: empresaDiferente,
      };
      mockRepository.findOne
        .mockResolvedValueOnce(contaOrigem)
        .mockResolvedValueOnce(contaDestinoOutraEmpresa);

      await expect(
        service.substituirConta(
          'origem-id',
          'destino-id',
          'user-id',
          'user@test.com',
        ),
      ).rejects.toThrow('As contas devem pertencer à mesma empresa');
    });

    it('deve lançar erro se origem e destino forem a mesma conta', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(contaOrigem)
        .mockResolvedValueOnce(contaOrigem);

      await expect(
        service.substituirConta(
          'origem-id',
          'origem-id',
          'user-id',
          'user@test.com',
        ),
      ).rejects.toThrow('A conta origem e destino não podem ser a mesma');
    });
  });

  describe('findAnaliticasAtivas', () => {
    it('deve retornar apenas contas analíticas e ativas', async () => {
      const contasAnaliticas = [
        { ...mockPlanoContas, id: '1', permite_lancamento: true, ativo: true },
        { ...mockPlanoContas, id: '2', permite_lancamento: true, ativo: true },
      ];
      mockRepository.find.mockResolvedValue(contasAnaliticas);

      const result = await service.findAnaliticasAtivas(mockEmpresa.id);

      expect(result).toEqual(contasAnaliticas);
      expect(repository.find).toHaveBeenCalledWith(
        {
          empresa: mockEmpresa.id,
          permite_lancamento: true,
          ativo: true,
          deletado_em: null,
        },
        expect.objectContaining({
          populate: ['parent'],
          orderBy: { codigo: 'ASC' },
        }),
      );
    });
  });

  describe('Multi-empresa validation', () => {
    it('deve impedir criar conta com parent de empresa diferente', async () => {
      const empresaDiferente = {
        id: 'empresa-diferente',
        nome: 'Outra Empresa',
      };
      const parentOutraEmpresa = {
        id: 'parent-outra-empresa',
        codigo: '1',
        descricao: 'Receitas',
        tipo: TipoPlanoContas.RECEITA,
        nivel: 1,
        permite_lancamento: false,
        ativo: true,
        empresa: empresaDiferente as any,
      };

      const createDto: CreatePlanoContasDto = {
        empresaId: mockEmpresa.id,
        codigo: '1.1.99', // Código único para evitar conflito
        descricao: 'Receitas de Vendas',
        tipo: TipoPlanoContas.RECEITA,
        nivel: 2,
        permite_lancamento: true,
        parentId: parentOutraEmpresa.id as string,
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockRepository.findOne
        .mockResolvedValueOnce(null) // Código não existe
        .mockResolvedValueOnce(parentOutraEmpresa); // Parent existe mas é de outra empresa

      try {
        await service.create(createDto);
        fail('Deveria ter lançado exceção');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain(
          'A conta pai deve pertencer à mesma empresa',
        );
      }
    });
  });

  describe('Validação de máscaras de código', () => {
    it('deve aceitar códigos hierárquicos válidos', async () => {
      const parentConta = {
        ...mockPlanoContas,
        id: 'parent-id',
        codigo: '1.1.2',
        nivel: 3,
        permite_lancamento: false,
      };

      const createDto: CreatePlanoContasDto = {
        empresaId: mockEmpresa.id,
        codigo: '1.1.2.3',
        descricao: 'Conta Válida',
        tipo: TipoPlanoContas.RECEITA,
        nivel: 4,
        permite_lancamento: true,
        parentId: 'parent-id',
      };

      mockEmpresaService.findOne.mockResolvedValue(mockEmpresa);
      mockRepository.findOne
        .mockResolvedValueOnce(null) // Código não existe
        .mockResolvedValueOnce(parentConta); // Parent existe
      mockRepository.create.mockReturnValue(mockPlanoContas);
      mockRepository.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
    });
  });
});
