import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { BackupService } from '../../src/backup/backup.service';
import { AuditService } from '../../src/audit/audit.service';
import { LocalStorageStrategy } from '../../src/backup/strategies/local-storage.strategy';
import { S3StorageStrategy } from '../../src/backup/strategies/s3-storage.strategy';
import {
  BackupLevel,
  BackupStorageType,
  BackupMetadata,
  BackupType,
} from '../../src/backup/interfaces/backup.interface';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ size: 2048 }),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('-- PostgreSQL database dump\nCREATE TABLE test;'),
}));

describe('BackupService', () => {
  let service: BackupService;
  let configService: ConfigService;
  let auditService: AuditService;
  let localStorageStrategy: LocalStorageStrategy;
  let s3StorageStrategy: S3StorageStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'backup.enabled': true,
        'backup.retention.daily.enabled': true,
        'backup.retention.daily.retentionDays': 30,
        'backup.retention.weekly.enabled': true,
        'backup.retention.weekly.retentionWeeks': 12,
        'backup.retention.weekly.dayOfWeek': 0,
        'backup.retention.monthly.enabled': true,
        'backup.retention.monthly.retentionMonths': 12,
        'backup.retention.monthly.dayOfMonth': 1,
        'backup.storage.local.enabled': true,
        'backup.storage.local.path': './backups',
        'backup.storage.s3.enabled': false,
        'backup.compression.enabled': true,
        'backup.compression.level': 6,
        'database.host': 'localhost',
        'database.port': 5432,
        'database.user': 'postgres',
        'database.password': 'postgres',
        'database.name': 'test_db',
      };
      return config[key];
    }),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockLocalStorageStrategy = {
    save: jest.fn().mockResolvedValue('/backups/daily/test.sql.gz'),
    retrieve: jest.fn().mockResolvedValue('/tmp/backup-restore/test.sql.gz'),
    delete: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(true),
  };

  const mockS3StorageStrategy = {
    save: jest.fn().mockResolvedValue('s3://bucket/test.sql.gz'),
    retrieve: jest.fn().mockResolvedValue('/tmp/backup-restore/test.sql.gz'),
    delete: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(true),
  };

  const createMockBackup = (overrides?: Partial<BackupMetadata>): BackupMetadata => ({
    id: 'backup-1',
    filename: 'backup_test_daily_2024-01-01.sql.gz',
    type: BackupType.FULL,
    level: BackupLevel.DAILY,
    storage: BackupStorageType.LOCAL,
    size: 1024000,
    checksum: 'abc123checksum',
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-01-31'),
    databaseName: 'test_db',
    compressed: true,
    encrypted: false,
    ...overrides,
  });

  const defaultConfigGet = (key: string) => {
    const config: Record<string, any> = {
      'backup.enabled': true,
      'backup.retention.daily.enabled': true,
      'backup.retention.daily.retentionDays': 30,
      'backup.retention.weekly.enabled': true,
      'backup.retention.weekly.retentionWeeks': 12,
      'backup.retention.weekly.dayOfWeek': 0,
      'backup.retention.monthly.enabled': true,
      'backup.retention.monthly.retentionMonths': 12,
      'backup.retention.monthly.dayOfMonth': 1,
      'backup.storage.local.enabled': true,
      'backup.storage.local.path': './backups',
      'backup.storage.s3.enabled': false,
      'backup.compression.enabled': true,
      'backup.compression.level': 6,
      'database.host': 'localhost',
      'database.port': 5432,
      'database.user': 'postgres',
      'database.password': 'postgres',
      'database.name': 'test_db',
    };
    return config[key];
  };

  beforeEach(async () => {
    mockConfigService.get.mockImplementation(defaultConfigGet);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: LocalStorageStrategy, useValue: mockLocalStorageStrategy },
        { provide: S3StorageStrategy, useValue: mockS3StorageStrategy },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    configService = module.get<ConfigService>(ConfigService);
    auditService = module.get<AuditService>(AuditService);
    localStorageStrategy = module.get<LocalStorageStrategy>(LocalStorageStrategy);
    s3StorageStrategy = module.get<S3StorageStrategy>(S3StorageStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Configuracao', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve inicializar com configuracoes corretas', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await service.onModuleInit();
      expect(configService.get).toHaveBeenCalledWith('backup.enabled');
    });

    it('deve criar diretorio temporario se nao existir', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await service.onModuleInit();
      expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/db-backups', { recursive: true });
    });

    it('deve retornar isEnabled corretamente', () => {
      expect(service.getIsEnabled()).toBe(true);
    });
  });

  describe('executeBackup', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'executePgDump').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'compressFile').mockResolvedValue('/tmp/db-backups/backup.sql.gz');
      jest.spyOn(service as any, 'calculateChecksum').mockResolvedValue('sha256checksum');
      (fs.statSync as jest.Mock).mockReturnValue({ size: 2048 });
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockLocalStorageStrategy.list.mockResolvedValue([]);
    });

    it('deve executar backup diario com sucesso', async () => {
      const result = await service.executeBackup(BackupLevel.DAILY);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.level).toBe(BackupLevel.DAILY);
      expect(result.metadata.compressed).toBe(true);
      expect(result.metadata.checksum).toBe('sha256checksum');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve executar backup semanal com sucesso', async () => {
      const result = await service.executeBackup(BackupLevel.WEEKLY);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.level).toBe(BackupLevel.WEEKLY);
    });

    it('deve executar backup mensal com sucesso', async () => {
      const result = await service.executeBackup(BackupLevel.MONTHLY);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.level).toBe(BackupLevel.MONTHLY);
    });

    it('deve salvar no armazenamento local quando habilitado', async () => {
      await service.executeBackup(BackupLevel.DAILY);

      expect(mockLocalStorageStrategy.save).toHaveBeenCalled();
      const savedMetadata = mockLocalStorageStrategy.save.mock.calls[0][1];
      expect(savedMetadata.storage).toBe(BackupStorageType.LOCAL);
    });

    it('deve registrar auditoria apos backup bem-sucedido', async () => {
      await service.executeBackup(BackupLevel.DAILY);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_CREATED',
          success: true,
          details: expect.objectContaining({
            level: BackupLevel.DAILY,
          }),
        }),
      );
    });

    it('deve remover arquivo temporario apos backup', async () => {
      await service.executeBackup(BackupLevel.DAILY);

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('deve aplicar politica de retencao apos backup', async () => {
      const retentionSpy = jest.spyOn(service, 'applyRetentionPolicy');

      await service.executeBackup(BackupLevel.DAILY);

      expect(retentionSpy).toHaveBeenCalled();
    });

    it('deve calcular data de expiracao corretamente para backup diario', async () => {
      const result = await service.executeBackup(BackupLevel.DAILY);

      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 30);

      const diffMs = Math.abs(result.metadata.expiresAt.getTime() - expectedExpiry.getTime());
      expect(diffMs).toBeLessThan(5000);
    });

    it('deve retornar erro quando pg_dump falha', async () => {
      jest.spyOn(service as any, 'executePgDump').mockRejectedValue(new Error('pg_dump failed'));

      const result = await service.executeBackup(BackupLevel.DAILY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('pg_dump failed');
    });

    it('deve registrar auditoria de falha quando backup falha', async () => {
      jest.spyOn(service as any, 'executePgDump').mockRejectedValue(new Error('pg_dump error'));

      await service.executeBackup(BackupLevel.DAILY);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_FAILED',
          severity: 'ERROR',
          success: false,
          errorMessage: 'pg_dump error',
        }),
      );
    });

    it('deve pular compressao quando desabilitada', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'backup.compression.enabled') return false;
        const config: Record<string, any> = {
          'backup.enabled': true,
          'backup.storage.local.enabled': true,
          'backup.storage.s3.enabled': false,
          'database.name': 'test_db',
          'backup.retention.daily.retentionDays': 30,
          'backup.retention.daily.enabled': true,
          'backup.retention.weekly.enabled': true,
          'backup.retention.weekly.retentionWeeks': 12,
          'backup.retention.weekly.dayOfWeek': 0,
          'backup.retention.monthly.enabled': true,
          'backup.retention.monthly.retentionMonths': 12,
          'backup.retention.monthly.dayOfMonth': 1,
        };
        return config[key];
      });

      const compressSpy = jest.spyOn(service as any, 'compressFile');

      const result = await service.executeBackup(BackupLevel.DAILY);

      expect(result.success).toBe(true);
      expect(compressSpy).not.toHaveBeenCalled();
    });

    it('deve salvar tambem no S3 quando habilitado', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'backup.storage.s3.enabled') return true;
        const config: Record<string, any> = {
          'backup.enabled': true,
          'backup.storage.local.enabled': true,
          'backup.compression.enabled': true,
          'backup.compression.level': 6,
          'database.name': 'test_db',
          'backup.retention.daily.retentionDays': 30,
          'backup.retention.daily.enabled': true,
          'backup.retention.weekly.enabled': true,
          'backup.retention.weekly.retentionWeeks': 12,
          'backup.retention.weekly.dayOfWeek': 0,
          'backup.retention.monthly.enabled': true,
          'backup.retention.monthly.retentionMonths': 12,
          'backup.retention.monthly.dayOfMonth': 1,
        };
        return config[key];
      });

      await service.executeBackup(BackupLevel.DAILY);

      expect(mockLocalStorageStrategy.save).toHaveBeenCalled();
      expect(mockS3StorageStrategy.save).toHaveBeenCalled();
    });
  });

  describe('restoreBackup', () => {
    const mockBackup = createMockBackup({ checksum: 'valid-checksum' });

    beforeEach(() => {
      mockLocalStorageStrategy.retrieve.mockResolvedValue('/tmp/backup-restore/test.sql.gz');
      mockLocalStorageStrategy.list.mockResolvedValue([mockBackup]);
      jest.spyOn(service as any, 'decompressFile').mockResolvedValue('/tmp/backup-restore/test.sql');
      jest.spyOn(service as any, 'calculateChecksum').mockResolvedValue('valid-checksum');
      jest.spyOn(service as any, 'executePgRestore').mockResolvedValue(undefined);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    });

    it('deve restaurar backup com sucesso', async () => {
      const result = await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(true);
      expect(result.restoredAt).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve validar checksum antes de restaurar', async () => {
      const checksumSpy = jest.spyOn(service as any, 'calculateChecksum');

      await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(checksumSpy).toHaveBeenCalled();
    });

    it('deve falhar quando checksum e invalido', async () => {
      jest.spyOn(service as any, 'calculateChecksum').mockResolvedValue('invalid-checksum');

      const result = await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Checksum');
    });

    it('deve falhar quando metadata nao encontrada', async () => {
      mockLocalStorageStrategy.list.mockResolvedValue([]);

      const result = await service.restoreBackup('backup-inexistente', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Metadata');
    });

    it('deve descomprimir backup comprimido antes de restaurar', async () => {
      const decompressSpy = jest.spyOn(service as any, 'decompressFile');

      await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(decompressSpy).toHaveBeenCalled();
    });

    it('deve registrar auditoria apos restauracao bem-sucedida', async () => {
      await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_RESTORED',
          severity: 'WARNING',
          success: true,
        }),
      );
    });

    it('deve registrar auditoria de falha quando restauracao falha', async () => {
      jest.spyOn(service as any, 'executePgRestore').mockRejectedValue(new Error('restore error'));

      await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_RESTORE_FAILED',
          severity: 'ERROR',
          success: false,
        }),
      );
    });

    it('deve usar S3 strategy quando storage e S3', async () => {
      const s3Backup = createMockBackup({ storage: BackupStorageType.S3, checksum: 'valid-checksum' });
      mockS3StorageStrategy.list.mockResolvedValue([s3Backup]);
      mockS3StorageStrategy.retrieve.mockResolvedValue('/tmp/backup-restore/test.sql.gz');

      await service.restoreBackup('backup-1', BackupStorageType.S3);

      expect(mockS3StorageStrategy.retrieve).toHaveBeenCalledWith('backup-1');
    });

    it('deve limpar arquivo descomprimido apos restauracao', async () => {
      await service.restoreBackup('backup-1', BackupStorageType.LOCAL);

      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('testRestore', () => {
    const mockBackup = createMockBackup({ checksum: 'valid-checksum' });

    beforeEach(() => {
      mockLocalStorageStrategy.exists.mockResolvedValue(true);
      mockLocalStorageStrategy.retrieve.mockResolvedValue('/tmp/backup-restore/test.sql.gz');
      mockLocalStorageStrategy.list.mockResolvedValue([mockBackup]);
      jest.spyOn(service as any, 'calculateChecksum').mockResolvedValue('valid-checksum');
      jest.spyOn(service as any, 'decompressFile').mockResolvedValue('/tmp/backup-restore/test.sql');
      (fs.readFileSync as jest.Mock).mockReturnValue('-- PostgreSQL database dump\nCREATE TABLE test;');
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    });

    it('deve testar restauracao com sucesso quando arquivo e valido', async () => {
      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('deve falhar quando backup nao encontrado', async () => {
      mockLocalStorageStrategy.exists.mockResolvedValue(false);

      const result = await service.testRestore('backup-inexistente', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('encontrado');
    });

    it('deve falhar quando checksum e invalido', async () => {
      jest.spyOn(service as any, 'calculateChecksum').mockResolvedValue('wrong-checksum');

      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Checksum');
    });

    it('deve falhar quando SQL e invalido', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid content without sql keywords');

      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('lido');
    });

    it('deve validar arquivo com CREATE TABLE', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('CREATE TABLE users (id int);');

      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(true);
    });

    it('deve validar arquivo com INSERT INTO', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue("INSERT INTO users VALUES (1, 'test');");

      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(true);
    });

    it('deve falhar quando metadata nao encontrada', async () => {
      mockLocalStorageStrategy.list.mockResolvedValue([]);

      const result = await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Metadata');
    });

    it('nao deve executar pg_restore (apenas validacao)', async () => {
      const restoreSpy = jest.spyOn(service as any, 'executePgRestore');

      await service.testRestore('backup-1', BackupStorageType.LOCAL);

      expect(restoreSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cron jobs', () => {
    describe('runDailyBackup', () => {
      it('deve retornar disabled quando backup esta desabilitado', async () => {
        (service as any).isEnabled = false;

        const result = await service.runDailyBackup();

        expect(result.success).toBe(false);
        expect(result.error).toContain('desabilitado');
      });

      it('deve executar backup quando habilitado', async () => {
        (service as any).isEnabled = true;
        const executeSpy = jest.spyOn(service, 'executeBackup').mockResolvedValue({
          success: true,
          duration: 100,
          metadata: createMockBackup(),
        });

        const result = await service.runDailyBackup();

        expect(executeSpy).toHaveBeenCalledWith(BackupLevel.DAILY);
        expect(result.success).toBe(true);
      });
    });

    describe('runWeeklyBackup', () => {
      it('deve retornar disabled quando backup esta desabilitado', async () => {
        (service as any).isEnabled = false;

        const result = await service.runWeeklyBackup();

        expect(result.success).toBe(false);
        expect(result.error).toContain('desabilitado');
      });

      it('deve retornar disabled quando nao e o dia configurado', async () => {
        (service as any).isEnabled = true;
        // Mock para dia diferente do configurado (0 = Domingo)
        const today = new Date().getDay();
        const differentDay = today === 0 ? 3 : 0;
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'backup.retention.weekly.dayOfWeek') return differentDay;
          const config: Record<string, any> = {
            'backup.enabled': true,
            'backup.retention.daily.enabled': true,
            'backup.retention.daily.retentionDays': 30,
            'backup.retention.weekly.enabled': true,
            'backup.retention.weekly.retentionWeeks': 12,
            'backup.retention.monthly.enabled': true,
            'backup.retention.monthly.retentionMonths': 12,
            'backup.retention.monthly.dayOfMonth': 1,
          };
          return config[key];
        });

        const result = await service.runWeeklyBackup();

        expect(result.success).toBe(false);
      });

      it('deve executar backup quando e o dia configurado', async () => {
        (service as any).isEnabled = true;
        const today = new Date().getDay();
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'backup.retention.weekly.dayOfWeek') return today;
          const config: Record<string, any> = {
            'backup.enabled': true,
            'backup.retention.daily.enabled': true,
            'backup.retention.daily.retentionDays': 30,
            'backup.retention.weekly.enabled': true,
            'backup.retention.weekly.retentionWeeks': 12,
            'backup.retention.monthly.enabled': true,
            'backup.retention.monthly.retentionMonths': 12,
            'backup.retention.monthly.dayOfMonth': 1,
          };
          return config[key];
        });

        const executeSpy = jest.spyOn(service, 'executeBackup').mockResolvedValue({
          success: true,
          duration: 100,
          metadata: createMockBackup({ level: BackupLevel.WEEKLY }),
        });

        const result = await service.runWeeklyBackup();

        expect(executeSpy).toHaveBeenCalledWith(BackupLevel.WEEKLY);
        expect(result.success).toBe(true);
      });
    });

    describe('runMonthlyBackup', () => {
      it('deve retornar disabled quando backup esta desabilitado', async () => {
        (service as any).isEnabled = false;

        const result = await service.runMonthlyBackup();

        expect(result.success).toBe(false);
        expect(result.error).toContain('desabilitado');
      });

      it('deve retornar disabled quando nao e o dia do mes configurado', async () => {
        (service as any).isEnabled = true;
        const today = new Date().getDate();
        const differentDay = today === 1 ? 15 : 1;
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'backup.retention.monthly.dayOfMonth') return differentDay;
          const config: Record<string, any> = {
            'backup.enabled': true,
            'backup.retention.daily.enabled': true,
            'backup.retention.daily.retentionDays': 30,
            'backup.retention.weekly.enabled': true,
            'backup.retention.weekly.retentionWeeks': 12,
            'backup.retention.weekly.dayOfWeek': 0,
            'backup.retention.monthly.enabled': true,
            'backup.retention.monthly.retentionMonths': 12,
          };
          return config[key];
        });

        const result = await service.runMonthlyBackup();

        expect(result.success).toBe(false);
      });

      it('deve executar backup quando e o dia do mes configurado', async () => {
        (service as any).isEnabled = true;
        const today = new Date().getDate();
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'backup.retention.monthly.dayOfMonth') return today;
          const config: Record<string, any> = {
            'backup.enabled': true,
            'backup.retention.daily.enabled': true,
            'backup.retention.daily.retentionDays': 30,
            'backup.retention.weekly.enabled': true,
            'backup.retention.weekly.retentionWeeks': 12,
            'backup.retention.weekly.dayOfWeek': 0,
            'backup.retention.monthly.enabled': true,
            'backup.retention.monthly.retentionMonths': 12,
          };
          return config[key];
        });

        const executeSpy = jest.spyOn(service, 'executeBackup').mockResolvedValue({
          success: true,
          duration: 100,
          metadata: createMockBackup({ level: BackupLevel.MONTHLY }),
        });

        const result = await service.runMonthlyBackup();

        expect(executeSpy).toHaveBeenCalledWith(BackupLevel.MONTHLY);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('executeManualBackup', () => {
    it('deve chamar executeBackup com o nivel informado', async () => {
      const executeSpy = jest.spyOn(service, 'executeBackup').mockResolvedValue({
        success: true,
        duration: 50,
        metadata: createMockBackup({ level: BackupLevel.WEEKLY }),
      });

      await service.executeManualBackup(BackupLevel.WEEKLY);

      expect(executeSpy).toHaveBeenCalledWith(BackupLevel.WEEKLY);
    });

    it('deve usar nivel DAILY como padrao', async () => {
      const executeSpy = jest.spyOn(service, 'executeBackup').mockResolvedValue({
        success: true,
        duration: 50,
        metadata: createMockBackup(),
      });

      await service.executeManualBackup();

      expect(executeSpy).toHaveBeenCalledWith(BackupLevel.DAILY);
    });
  });

  describe('listBackups', () => {
    it('deve listar backups locais', async () => {
      const mockBackups: BackupMetadata[] = [createMockBackup()];

      mockLocalStorageStrategy.list.mockResolvedValue(mockBackups);

      const result = await service.listBackups(BackupStorageType.LOCAL);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('backup-1');
      expect(mockLocalStorageStrategy.list).toHaveBeenCalled();
    });

    it('deve listar backups de todos os armazenamentos quando nao especificado', async () => {
      const localBackups: BackupMetadata[] = [createMockBackup({ id: 'backup-local' })];

      mockLocalStorageStrategy.list.mockResolvedValue(localBackups);

      const result = await service.listBackups();

      expect(result).toHaveLength(1);
      expect(mockLocalStorageStrategy.list).toHaveBeenCalled();
    });

    it('deve ordenar backups por data de criacao (mais recente primeiro)', async () => {
      const backups: BackupMetadata[] = [
        createMockBackup({ id: 'old', createdAt: new Date('2024-01-01') }),
        createMockBackup({ id: 'new', createdAt: new Date('2024-06-01') }),
      ];

      mockLocalStorageStrategy.list.mockResolvedValue(backups);

      const result = await service.listBackups(BackupStorageType.LOCAL);

      expect(result[0].id).toBe('new');
      expect(result[1].id).toBe('old');
    });
  });

  describe('deleteBackup', () => {
    it('deve excluir um backup local', async () => {
      mockLocalStorageStrategy.delete.mockResolvedValue(true);

      const result = await service.deleteBackup('backup-1', BackupStorageType.LOCAL);

      expect(result).toBe(true);
      expect(mockLocalStorageStrategy.delete).toHaveBeenCalledWith('backup-1');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('deve retornar false quando backup nao existe', async () => {
      mockLocalStorageStrategy.delete.mockResolvedValue(false);

      const result = await service.deleteBackup('backup-inexistente', BackupStorageType.LOCAL);

      expect(result).toBe(false);
    });

    it('deve usar S3 strategy para backup S3', async () => {
      mockS3StorageStrategy.delete.mockResolvedValue(true);

      const result = await service.deleteBackup('backup-1', BackupStorageType.S3);

      expect(result).toBe(true);
      expect(mockS3StorageStrategy.delete).toHaveBeenCalledWith('backup-1');
    });

    it('deve registrar auditoria ao excluir backup', async () => {
      mockLocalStorageStrategy.delete.mockResolvedValue(true);

      await service.deleteBackup('backup-1', BackupStorageType.LOCAL);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_DELETED',
          severity: 'WARNING',
          details: expect.objectContaining({ backupId: 'backup-1' }),
        }),
      );
    });

    it('nao deve registrar auditoria quando backup nao encontrado', async () => {
      mockLocalStorageStrategy.delete.mockResolvedValue(false);

      await service.deleteBackup('backup-1', BackupStorageType.LOCAL);

      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('applyRetentionPolicy', () => {
    it('deve remover backups expirados', async () => {
      const expiredBackup = createMockBackup({
        id: 'backup-expired',
        expiresAt: new Date('2023-01-31'),
      });

      mockLocalStorageStrategy.list.mockResolvedValue([expiredBackup]);
      mockLocalStorageStrategy.delete.mockResolvedValue(true);

      const result = await service.applyRetentionPolicy();

      expect(result.deleted).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockLocalStorageStrategy.delete).toHaveBeenCalledWith('backup-expired');
    });

    it('deve manter backups nao expirados', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const validBackup = createMockBackup({
        id: 'backup-valid',
        expiresAt: futureDate,
      });

      mockLocalStorageStrategy.list.mockResolvedValue([validBackup]);

      const result = await service.applyRetentionPolicy();

      expect(result.deleted).toBe(0);
      expect(mockLocalStorageStrategy.delete).not.toHaveBeenCalled();
    });

    it('deve contar erros ao falhar na exclusao', async () => {
      const expiredBackup = createMockBackup({
        id: 'backup-error',
        expiresAt: new Date('2023-01-31'),
      });

      mockLocalStorageStrategy.list.mockResolvedValue([expiredBackup]);
      mockLocalStorageStrategy.delete.mockRejectedValue(new Error('delete error'));

      const result = await service.applyRetentionPolicy();

      expect(result.deleted).toBe(0);
      expect(result.errors).toBe(1);
    });

    it('deve registrar auditoria quando backups sao removidos', async () => {
      const expiredBackup = createMockBackup({
        id: 'backup-expired',
        expiresAt: new Date('2023-01-31'),
      });

      mockLocalStorageStrategy.list.mockResolvedValue([expiredBackup]);
      mockLocalStorageStrategy.delete.mockResolvedValue(true);

      await service.applyRetentionPolicy();

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BACKUP_RETENTION_APPLIED',
          details: expect.objectContaining({ deleted: 1 }),
        }),
      );
    });
  });

  describe('Politica de Retencao Multi-Nivel', () => {
    it('deve ter configuracao de retencao diaria de 30 dias', () => {
      expect(configService.get('backup.retention.daily.retentionDays')).toBe(30);
    });

    it('deve ter configuracao de retencao semanal de 12 semanas', () => {
      expect(configService.get('backup.retention.weekly.retentionWeeks')).toBe(12);
    });

    it('deve ter configuracao de retencao mensal de 12 meses', () => {
      expect(configService.get('backup.retention.monthly.retentionMonths')).toBe(12);
    });
  });

  describe('Armazenamento', () => {
    it('deve ter armazenamento local habilitado', () => {
      expect(configService.get('backup.storage.local.enabled')).toBe(true);
    });

    it('deve ter caminho de backup local configurado', () => {
      expect(configService.get('backup.storage.local.path')).toBe('./backups');
    });

    it('deve ter compressao habilitada', () => {
      expect(configService.get('backup.compression.enabled')).toBe(true);
    });
  });
});

describe('LocalStorageStrategy', () => {
  let strategy: LocalStorageStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'backup.storage.local.path') return '/tmp/test-backups';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<LocalStorageStrategy>(LocalStorageStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('deve estar definido', () => {
    expect(strategy).toBeDefined();
  });

  it('deve ter tipo LOCAL', () => {
    expect(strategy.type).toBe(BackupStorageType.LOCAL);
  });
});

describe('Integracao de Backup', () => {
  it('deve validar estrutura de metadata', () => {
    const metadata: BackupMetadata = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      filename: 'backup_test_daily_2024-01-01T00-00-00-000Z.sql.gz',
      type: BackupType.FULL,
      level: BackupLevel.DAILY,
      storage: BackupStorageType.LOCAL,
      size: 1024000,
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      databaseName: 'financeiro-api',
      compressed: true,
      encrypted: false,
    };

    expect(metadata.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(metadata.checksum).toHaveLength(64);
    expect(metadata.expiresAt.getTime()).toBeGreaterThan(metadata.createdAt.getTime());
  });

  it('deve validar niveis de backup', () => {
    expect(BackupLevel.DAILY).toBe('daily');
    expect(BackupLevel.WEEKLY).toBe('weekly');
    expect(BackupLevel.MONTHLY).toBe('monthly');
  });

  it('deve validar tipos de armazenamento', () => {
    expect(BackupStorageType.LOCAL).toBe('local');
    expect(BackupStorageType.S3).toBe('s3');
  });
});
