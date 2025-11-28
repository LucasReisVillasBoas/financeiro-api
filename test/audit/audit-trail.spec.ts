import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditEventType, AuditSeverity } from '../../src/audit/audit.service';
import { EntityManager } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Auditoria } from '../../src/entities/auditoria/auditoria.entity';

describe('Audit Trail Tests', () => {
  let auditService: AuditService;
  let mockRepository: any;
  let mockEntityManager: any;
  let capturedAuditLogs: any[] = [];

  beforeEach(async () => {
    capturedAuditLogs = [];

    mockRepository = {
      create: jest.fn().mockImplementation((data) => {
        const log = { id: 'audit-' + Date.now(), ...data };
        capturedAuditLogs.push(log);
        return log;
      }),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockEntityManager = {
      persistAndFlush: jest.fn().mockResolvedValue(undefined),
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
      findOne: jest.fn().mockResolvedValue({ id: 'empresa-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(Auditoria),
          useValue: mockRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    auditService = module.get<AuditService>(AuditService);
  });

  describe('Registro de Auditoria - Campos Obrigatórios', () => {
    it('deve registrar log com usuário identificado', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        userEmail: 'usuario@teste.com',
        empresaId: 'empresa-123',
        success: true,
        details: { contaId: 'conta-456' },
      });

      expect(mockRepository.create).toHaveBeenCalled();
      const logCreated = capturedAuditLogs[0];
      expect(logCreated.usuario).toBeDefined();
      expect(logCreated.detalhes.userEmail).toBe('usuario@teste.com');
    });

    it('deve registrar log com data/hora', async () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');

      await auditService.log({
        timestamp,
        eventType: AuditEventType.CONTA_PAGAR_UPDATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        success: true,
      });

      expect(mockRepository.create).toHaveBeenCalled();
      const logCreated = capturedAuditLogs[0];
      expect(logCreated.data_hora).toEqual(timestamp);
    });

    it('deve registrar log com ação identificada', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        resource: 'contas_pagar',
        action: 'CRIAR',
        userId: 'user-123',
        success: true,
      });

      expect(mockRepository.create).toHaveBeenCalled();
      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('CREATE');
      expect(logCreated.modulo).toBe('CONTA_PAGAR');
      expect(logCreated.detalhes.action).toBe('CRIAR');
    });

    it('deve registrar log com valores antes/depois', async () => {
      const valoresAnteriores = {
        documento: 'DOC-001',
        valor: 100.0,
        status: 'Pendente',
      };

      const valoresPosteriores = {
        documento: 'DOC-001',
        valor: 150.0,
        status: 'Pendente',
      };

      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_UPDATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        success: true,
        details: {
          camposAlterados: {
            valor: { de: 100.0, para: 150.0 },
          },
          valoresAnteriores,
          valoresPosteriores,
        },
      });

      expect(mockRepository.create).toHaveBeenCalled();
      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.valoresAnteriores).toEqual(valoresAnteriores);
      expect(logCreated.detalhes.valoresPosteriores).toEqual(valoresPosteriores);
      expect(logCreated.detalhes.camposAlterados.valor.de).toBe(100.0);
      expect(logCreated.detalhes.camposAlterados.valor.para).toBe(150.0);
    });
  });

  describe('Tipos de Eventos de Auditoria', () => {
    it('deve auditar criação de conta a pagar', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        details: {
          message: 'Conta a pagar DOC-001 criada',
          contaId: 'conta-123',
          documento: 'DOC-001',
          valorTotal: 1500.0,
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('CREATE');
      expect(logCreated.modulo).toBe('CONTA_PAGAR');
      expect(logCreated.detalhes.contaId).toBe('conta-123');
    });

    it('deve auditar edição de conta a pagar', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_UPDATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        resource: 'contas_pagar',
        action: 'EDITAR',
        details: {
          message: 'Conta a pagar DOC-001 editada',
          contaId: 'conta-123',
          camposAlterados: {
            descricao: { de: 'Antiga', para: 'Nova' },
          },
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('UPDATE');
      expect(logCreated.detalhes.action).toBe('EDITAR');
      expect(logCreated.detalhes.camposAlterados).toBeDefined();
    });

    it('deve auditar baixa de pagamento', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_UPDATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        resource: 'contas_pagar',
        action: 'REGISTRAR_BAIXA',
        details: {
          message: 'Baixa registrada para conta DOC-001',
          contaId: 'conta-123',
          valorPago: 500.0,
          saldoAnterior: 1500.0,
          saldoPosterior: 1000.0,
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.action).toBe('REGISTRAR_BAIXA');
      expect(logCreated.detalhes.saldoAnterior).toBe(1500.0);
      expect(logCreated.detalhes.saldoPosterior).toBe(1000.0);
    });

    it('deve auditar estorno de pagamento com severidade CRITICAL', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_UPDATED,
        severity: AuditSeverity.CRITICAL,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        resource: 'contas_pagar',
        action: 'ESTORNAR_BAIXA',
        details: {
          message: 'Baixa estornada para conta DOC-001',
          contaId: 'conta-123',
          valorEstornado: 500.0,
          justificativa: 'Pagamento duplicado',
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.action).toBe('ESTORNAR_BAIXA');
      expect(logCreated.detalhes.justificativa).toBe('Pagamento duplicado');
    });

    it('deve auditar criação de conta a receber', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_RECEBER_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        details: {
          message: 'Conta a receber NF-001 criada',
          contaId: 'conta-456',
          documento: 'NF-001',
          valorTotal: 2000.0,
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('CREATE');
      expect(logCreated.modulo).toBe('CONTA_RECEBER');
    });

    it('deve auditar liquidação de conta a receber', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_RECEBER_UPDATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        resource: 'contas_receber',
        action: 'LIQUIDAR',
        details: {
          message: 'Conta a receber NF-001 liquidada',
          contaId: 'conta-456',
          valorRecebido: 2000.0,
          saldoAnterior: 2000.0,
          saldoPosterior: 0,
          statusAnterior: 'Pendente',
          statusPosterior: 'Liquidado',
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.action).toBe('LIQUIDAR');
      expect(logCreated.detalhes.saldoPosterior).toBe(0);
      expect(logCreated.detalhes.statusPosterior).toBe('Liquidado');
    });

    it('deve auditar cancelamento com severidade WARNING', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_DELETED,
        severity: AuditSeverity.CRITICAL,
        userId: 'user-123',
        empresaId: 'empresa-123',
        success: true,
        resource: 'contas_pagar',
        action: 'CANCELAR',
        details: {
          message: 'Conta a pagar DOC-001 cancelada',
          contaId: 'conta-123',
          justificativa: 'Emissão incorreta',
        },
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.action).toBe('CANCELAR');
      expect(logCreated.detalhes.justificativa).toBe('Emissão incorreta');
    });
  });

  describe('Métodos Auxiliares de Auditoria', () => {
    it('deve usar logEntityCreated para registrar criação', async () => {
      await auditService.logEntityCreated(
        'CONTA_PAGAR',
        'conta-123',
        'user-123',
        'usuario@teste.com',
        'empresa-123',
        { documento: 'DOC-001', valorTotal: 1500.0 },
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('CREATE');
      expect(logCreated.modulo).toBe('CONTA_PAGAR');
      expect(logCreated.detalhes.entityId).toBe('conta-123');
    });

    it('deve usar logEntityUpdated para registrar atualização', async () => {
      await auditService.logEntityUpdated(
        'CONTA_RECEBER',
        'conta-456',
        'user-123',
        'usuario@teste.com',
        'empresa-123',
        { camposAlterados: { valor: { de: 100, para: 200 } } },
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('UPDATE');
      expect(logCreated.modulo).toBe('CONTA_RECEBER');
    });

    it('deve usar logEntityDeleted para registrar exclusão', async () => {
      await auditService.logEntityDeleted(
        'CONTA_PAGAR',
        'conta-123',
        'user-123',
        'usuario@teste.com',
        'empresa-123',
        { motivo: 'Registro duplicado' },
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('DELETE');
      expect(logCreated.modulo).toBe('CONTA_PAGAR');
    });

    it('deve usar logSaldoInicialUpdated para alteração de saldo inicial', async () => {
      await auditService.logSaldoInicialUpdated(
        'conta-bancaria-123',
        'user-123',
        'usuario@teste.com',
        'empresa-123',
        1000.0,
        1500.0,
        'Ajuste de conciliação',
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.detalhes.saldoAnterior).toBe(1000.0);
      expect(logCreated.detalhes.saldoNovo).toBe(1500.0);
      expect(logCreated.detalhes.diferenca).toBe(500.0);
      expect(logCreated.detalhes.motivo).toBe('Ajuste de conciliação');
    });
  });

  describe('Auditoria de Autenticação e Autorização', () => {
    it('deve auditar login bem-sucedido', async () => {
      await auditService.logLoginAttempt(
        'usuario@teste.com',
        true,
        '192.168.1.1',
        'Mozilla/5.0',
        undefined,
        'user-123',
        'empresa-123',
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('LOGIN');
      expect(logCreated.resultado).toBe('SUCESSO');
      expect(logCreated.ip_address).toBe('192.168.1.1');
    });

    it('deve auditar login falho', async () => {
      await auditService.logLoginAttempt(
        'usuario@teste.com',
        false,
        '192.168.1.1',
        'Mozilla/5.0',
        'Senha incorreta',
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('LOGIN');
      expect(logCreated.resultado).toBe('NEGADO');
      expect(logCreated.mensagem_erro).toBe('Senha incorreta');
    });

    it('deve auditar acesso negado por falta de role', async () => {
      await auditService.logAccessDeniedNoRole(
        'user-123',
        'usuario@teste.com',
        ['Administrador'],
        ['Operador'],
        '/api/auditoria',
        'GET',
        '192.168.1.1',
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('ACCESS_DENIED');
      expect(logCreated.modulo).toBe('AUTHORIZATION');
      expect(logCreated.detalhes.requiredRoles).toContain('Administrador');
      expect(logCreated.detalhes.userRoles).toContain('Operador');
    });

    it('deve auditar acesso negado por empresa inválida', async () => {
      await auditService.logAccessDeniedWrongEmpresa(
        'user-123',
        'usuario@teste.com',
        'empresa-999',
        ['empresa-123', 'empresa-456'],
        '/api/contas-pagar',
        'GET',
        '192.168.1.1',
      );

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.acao).toBe('ACCESS_DENIED');
      expect(logCreated.detalhes.attemptedEmpresaId).toBe('empresa-999');
      expect(logCreated.detalhes.userEmpresasIds).toContain('empresa-123');
    });
  });

  describe('Informações Adicionais de Contexto', () => {
    it('deve capturar IP address', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        ipAddress: '192.168.1.100',
        success: true,
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.ip_address).toBe('192.168.1.100');
    });

    it('deve capturar User Agent', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.user_agent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('deve registrar resultado como SUCESSO para operações bem-sucedidas', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.INFO,
        userId: 'user-123',
        success: true,
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.resultado).toBe('SUCESSO');
    });

    it('deve registrar resultado como FALHA para operações com erro', async () => {
      await auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.CONTA_PAGAR_CREATED,
        severity: AuditSeverity.ERROR,
        userId: 'user-123',
        success: false,
        errorMessage: 'Erro ao criar conta',
      });

      const logCreated = capturedAuditLogs[0];
      expect(logCreated.resultado).toBe('NEGADO');
      expect(logCreated.mensagem_erro).toBe('Erro ao criar conta');
    });
  });

  describe('Helpers Estáticos', () => {
    it('deve extrair IP address da request', () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      const ip = AuditService.extractIpAddress(mockRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('deve extrair IP do header x-forwarded-for', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '10.0.0.1',
        },
      };

      const ip = AuditService.extractIpAddress(mockRequest);
      expect(ip).toBe('10.0.0.1');
    });

    it('deve extrair User Agent da request', () => {
      const mockRequest = {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      const userAgent = AuditService.extractUserAgent(mockRequest);
      expect(userAgent).toBe('Mozilla/5.0');
    });
  });
});
