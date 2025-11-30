import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContasBancariasService } from '../../src/conta-bancaria/conta-bancaria.service';
import { ContasBancarias } from '../../src/entities/conta-bancaria/conta-bancaria.entity';
import { EmpresaService } from '../../src/empresa/empresa.service';
import { AuditService } from '../../src/audit/audit.service';
import { UsuarioService } from '../../src/usuario/usuario.service';
import { PerfilService } from '../../src/perfil/perfil.service';

describe('ContasBancariasService', () => {
  let service: ContasBancariasService;
  let contasBancariasRepository: any;
  let empresaService: any;
  let auditService: any;
  let usuarioService: any;
  let perfilService: any;

  const mockEmpresa = { id: 'empresa-123', razao_social: 'Empresa Teste' };
  const mockUsuario = { id: 'user-123', email: 'user@test.com' };

  const mockContaBancaria = {
    id: 'conta-123',
    banco: 'Banco do Brasil',
    agencia: '1234',
    conta: '12345',
    conta_digito: '6',
    descricao: 'Conta Principal',
    saldo_inicial: 1000,
    saldo_atual: 1500,
    ativo: true,
    deletadoEm: null,
    empresa: mockEmpresa,
    cliente_id: 'user-123',
    data_referencia_saldo: new Date(),
  };

  beforeEach(async () => {
    contasBancariasRepository = {
      create: jest.fn().mockImplementation((data) => ({ id: 'nova-conta-123', ...data })),
      find: jest.fn().mockResolvedValue([mockContaBancaria]),
      findOne: jest.fn().mockResolvedValue({ ...mockContaBancaria }),
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined),
      assign: jest.fn(),
    };

    empresaService = {
      findOne: jest.fn().mockResolvedValue(mockEmpresa),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
      logEntityCreated: jest.fn().mockResolvedValue(undefined),
      logEntityUpdated: jest.fn().mockResolvedValue(undefined),
      logEntityDeleted: jest.fn().mockResolvedValue(undefined),
      logSaldoInicialUpdated: jest.fn().mockResolvedValue(undefined),
    };

    usuarioService = {
      getById: jest.fn().mockResolvedValue(mockUsuario),
    };

    perfilService = {
      findByCliente: jest.fn().mockResolvedValue([{ nome: 'Admnistrador' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContasBancariasService,
        {
          provide: getRepositoryToken(ContasBancarias),
          useValue: contasBancariasRepository,
        },
        {
          provide: EmpresaService,
          useValue: empresaService,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: UsuarioService,
          useValue: usuarioService,
        },
        {
          provide: PerfilService,
          useValue: perfilService,
        },
      ],
    }).compile();

    service = module.get<ContasBancariasService>(ContasBancariasService);
  });

  describe('create', () => {
    const createDto = {
      banco: 'Banco do Brasil',
      agencia: '1234',
      conta: '12345',
      conta_digito: '6',
      descricao: 'Conta Principal',
      tipo: 'Conta Corrente',
      saldo_inicial: 1000,
      data_referencia_saldo: '2024-01-15',
      empresaId: 'empresa-123',
      cliente_id: 'user-123',
    };

    it('deve criar uma conta bancária com sucesso', async () => {
      contasBancariasRepository.findOne.mockResolvedValueOnce(null); // Não existe duplicada

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(contasBancariasRepository.create).toHaveBeenCalled();
      expect(auditService.logEntityCreated).toHaveBeenCalled();
    });

    it('deve lançar erro se empresa não encontrada', async () => {
      empresaService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se conta duplicada', async () => {
      // findOne retorna conta duplicada na primeira chamada
      contasBancariasRepository.findOne.mockResolvedValueOnce(mockContaBancaria);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('deve definir saldo_atual igual ao saldo_inicial na criação', async () => {
      contasBancariasRepository.findOne.mockResolvedValueOnce(null);

      await service.create(createDto);

      expect(contasBancariasRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saldo_atual: createDto.saldo_inicial,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as contas bancárias ativas', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockContaBancaria]);
      expect(contasBancariasRepository.find).toHaveBeenCalledWith({
        deletadoEm: null,
      });
    });
  });

  describe('findByEmpresa', () => {
    it('deve retornar contas de uma empresa específica', async () => {
      const result = await service.findByEmpresa('empresa-123');

      expect(result).toEqual([mockContaBancaria]);
      expect(contasBancariasRepository.find).toHaveBeenCalledWith({
        empresa: 'empresa-123',
        deletadoEm: null,
      });
    });

    it('deve retornar array vazio se não houver contas', async () => {
      contasBancariasRepository.find.mockResolvedValue(null);

      const result = await service.findByEmpresa('empresa-sem-contas');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma conta por ID', async () => {
      const result = await service.findOne('conta-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('conta-123');
    });

    it('deve lançar erro se conta não encontrada', async () => {
      contasBancariasRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('conta-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      descricao: 'Nova descrição',
      cliente_id: 'user-123',
    };

    it('deve atualizar uma conta bancária', async () => {
      const result = await service.update('conta-123', updateDto);

      expect(result).toBeDefined();
      expect(contasBancariasRepository.assign).toHaveBeenCalled();
      expect(contasBancariasRepository.flush).toHaveBeenCalled();
    });

    it('deve registrar auditoria ao alterar saldo_inicial', async () => {
      const updateComSaldo = {
        ...updateDto,
        saldo_inicial: 2000, // Diferente do atual (1000)
      };

      await service.update('conta-123', updateComSaldo);

      expect(auditService.logSaldoInicialUpdated).toHaveBeenCalled();
    });

    it('não deve registrar auditoria se saldo_inicial não mudou', async () => {
      const updateSemMudanca = {
        ...updateDto,
        saldo_inicial: 1000, // Igual ao atual
      };

      await service.update('conta-123', updateSemMudanca);

      expect(auditService.logSaldoInicialUpdated).not.toHaveBeenCalled();
    });
  });

  describe('atualizarSaldoAtual', () => {
    it('deve atualizar o saldo atual', async () => {
      const novoSaldo = 2500;

      const result = await service.atualizarSaldoAtual('conta-123', novoSaldo);

      expect(result.saldo_atual).toBe(novoSaldo);
      expect(contasBancariasRepository.flush).toHaveBeenCalled();
    });
  });

  describe('atualizarSaldoInicial', () => {
    it('deve atualizar saldo inicial com permissão de admin', async () => {
      const novoSaldoInicial = 2000;

      const result = await service.atualizarSaldoInicial(
        'conta-123',
        novoSaldoInicial,
        'user-123',
        'user@test.com',
        'Ajuste de conciliação',
      );

      expect(result).toBeDefined();
      expect(auditService.logSaldoInicialUpdated).toHaveBeenCalled();
    });

    it('deve lançar erro se usuário não é admin ou financeiro', async () => {
      perfilService.findByCliente.mockResolvedValue([{ nome: 'Operador' }]);

      await expect(
        service.atualizarSaldoInicial(
          'conta-123',
          2000,
          'user-123',
          'user@test.com',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve ajustar saldo_atual proporcionalmente', async () => {
      const contaMock = { ...mockContaBancaria, saldo_inicial: 1000, saldo_atual: 1500 };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      await service.atualizarSaldoInicial(
        'conta-123',
        1500, // Aumentando 500
        'user-123',
        'user@test.com',
      );

      // saldo_atual deve aumentar 500 também: 1500 + 500 = 2000
      expect(contaMock.saldo_atual).toBe(2000);
    });

    it('deve permitir acesso para perfil Financeiro', async () => {
      perfilService.findByCliente.mockResolvedValue([{ nome: 'Financeiro' }]);

      const result = await service.atualizarSaldoInicial(
        'conta-123',
        2000,
        'user-123',
        'user@test.com',
      );

      expect(result).toBeDefined();
    });
  });

  describe('toggleStatus', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const contaMock = { ...mockContaBancaria, ativo: true, empresa: mockEmpresa };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      const result = await service.toggleStatus('conta-123', 'user-123', 'user@test.com');

      expect(result.ativo).toBe(false);
    });

    it('deve alternar status de inativo para ativo', async () => {
      const contaMock = { ...mockContaBancaria, ativo: false, empresa: mockEmpresa };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      const result = await service.toggleStatus('conta-123', 'user-123', 'user@test.com');

      expect(result.ativo).toBe(true);
    });

    it('deve registrar auditoria ao alterar status', async () => {
      const contaMock = { ...mockContaBancaria, empresa: mockEmpresa };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      await service.toggleStatus('conta-123', 'user-123', 'user@test.com');

      expect(auditService.logEntityUpdated).toHaveBeenCalledWith(
        'CONTA_BANCARIA',
        'conta-123',
        'user-123',
        'user@test.com',
        mockEmpresa.id,
        expect.objectContaining({
          acao: 'TOGGLE_STATUS',
        }),
      );
    });
  });

  describe('softDelete', () => {
    it('deve marcar conta como deletada', async () => {
      const contaMock = { ...mockContaBancaria, empresa: mockEmpresa };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      await service.softDelete('conta-123', 'user-123', 'user@test.com');

      expect(contaMock.deletadoEm).toBeDefined();
      expect(contaMock.ativo).toBe(false);
    });

    it('deve registrar auditoria de exclusão', async () => {
      const contaMock = { ...mockContaBancaria, empresa: mockEmpresa };
      contasBancariasRepository.findOne.mockResolvedValue(contaMock);

      await service.softDelete('conta-123', 'user-123', 'user@test.com');

      expect(auditService.logEntityDeleted).toHaveBeenCalledWith(
        'CONTA_BANCARIA',
        'conta-123',
        'user-123',
        'user@test.com',
        mockEmpresa.id,
        expect.any(Object),
      );
    });
  });

  describe('Regras de Negócio', () => {
    it('não deve permitir conta duplicada (mesma empresa/banco/agência/conta)', async () => {
      contasBancariasRepository.findOne.mockResolvedValueOnce(mockContaBancaria);

      const dto = {
        banco: mockContaBancaria.banco,
        agencia: mockContaBancaria.agencia,
        conta: mockContaBancaria.conta,
        conta_digito: mockContaBancaria.conta_digito,
        descricao: 'Conta Duplicada',
        tipo: 'Conta Corrente',
        empresaId: 'empresa-123',
        cliente_id: 'user-123',
        saldo_inicial: 0,
        data_referencia_saldo: '2024-01-15',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('deve permitir conta com mesmos dados em empresa diferente', async () => {
      contasBancariasRepository.findOne.mockResolvedValueOnce(null); // Não existe duplicada

      const dto = {
        banco: mockContaBancaria.banco,
        agencia: mockContaBancaria.agencia,
        conta: mockContaBancaria.conta,
        descricao: 'Outra Conta',
        tipo: 'Conta Corrente',
        empresaId: 'empresa-456', // Empresa diferente
        cliente_id: 'user-123',
        saldo_inicial: 0,
        data_referencia_saldo: '2024-01-15',
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
    });
  });
});
