import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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

  beforeEach(async () => {
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
  });

  describe('Configuração', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve inicializar com configurações corretas', async () => {
      await service.onModuleInit();
      expect(configService.get).toHaveBeenCalledWith('backup.enabled');
    });
  });

  describe('listBackups', () => {
    it('deve listar backups locais', async () => {
      const mockBackups: BackupMetadata[] = [
        {
          id: 'backup-1',
          filename: 'backup_test_daily_2024-01-01.sql.gz',
          type: BackupType.FULL,
          level: BackupLevel.DAILY,
          storage: BackupStorageType.LOCAL,
          size: 1024000,
          checksum: 'abc123',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-31'),
          databaseName: 'test_db',
          compressed: true,
          encrypted: false,
        },
      ];

      mockLocalStorageStrategy.list.mockResolvedValue(mockBackups);

      const result = await service.listBackups(BackupStorageType.LOCAL);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('backup-1');
      expect(mockLocalStorageStrategy.list).toHaveBeenCalled();
    });

    it('deve listar backups de todos os armazenamentos quando não especificado', async () => {
      const localBackups: BackupMetadata[] = [
        {
          id: 'backup-local',
          filename: 'backup_local.sql.gz',
          type: BackupType.FULL,
          level: BackupLevel.DAILY,
          storage: BackupStorageType.LOCAL,
          size: 1024000,
          checksum: 'abc123',
          createdAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-31'),
          databaseName: 'test_db',
          compressed: true,
          encrypted: false,
        },
      ];

      mockLocalStorageStrategy.list.mockResolvedValue(localBackups);

      const result = await service.listBackups();

      expect(result).toHaveLength(1);
      expect(mockLocalStorageStrategy.list).toHaveBeenCalled();
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

    it('deve retornar false quando backup não existe', async () => {
      mockLocalStorageStrategy.delete.mockResolvedValue(false);

      const result = await service.deleteBackup('backup-inexistente', BackupStorageType.LOCAL);

      expect(result).toBe(false);
    });
  });

  describe('applyRetentionPolicy', () => {
    it('deve remover backups expirados', async () => {
      const expiredBackup: BackupMetadata = {
        id: 'backup-expired',
        filename: 'backup_expired.sql.gz',
        type: BackupType.FULL,
        level: BackupLevel.DAILY,
        storage: BackupStorageType.LOCAL,
        size: 1024000,
        checksum: 'abc123',
        createdAt: new Date('2023-01-01'),
        expiresAt: new Date('2023-01-31'), // Expirado
        databaseName: 'test_db',
        compressed: true,
        encrypted: false,
      };

      mockLocalStorageStrategy.list.mockResolvedValue([expiredBackup]);
      mockLocalStorageStrategy.delete.mockResolvedValue(true);

      const result = await service.applyRetentionPolicy();

      expect(result.deleted).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockLocalStorageStrategy.delete).toHaveBeenCalledWith('backup-expired');
    });

    it('deve manter backups não expirados', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const validBackup: BackupMetadata = {
        id: 'backup-valid',
        filename: 'backup_valid.sql.gz',
        type: BackupType.FULL,
        level: BackupLevel.DAILY,
        storage: BackupStorageType.LOCAL,
        size: 1024000,
        checksum: 'abc123',
        createdAt: new Date(),
        expiresAt: futureDate,
        databaseName: 'test_db',
        compressed: true,
        encrypted: false,
      };

      mockLocalStorageStrategy.list.mockResolvedValue([validBackup]);

      const result = await service.applyRetentionPolicy();

      expect(result.deleted).toBe(0);
      expect(mockLocalStorageStrategy.delete).not.toHaveBeenCalled();
    });
  });

  describe('Política de Retenção Multi-Nível', () => {
    it('deve ter configuração de retenção diária de 30 dias', () => {
      expect(configService.get('backup.retention.daily.retentionDays')).toBe(30);
    });

    it('deve ter configuração de retenção semanal de 12 semanas', () => {
      expect(configService.get('backup.retention.weekly.retentionWeeks')).toBe(12);
    });

    it('deve ter configuração de retenção mensal de 12 meses', () => {
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

    it('deve ter compressão habilitada', () => {
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

describe('Integração de Backup', () => {
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

  it('deve validar níveis de backup', () => {
    expect(BackupLevel.DAILY).toBe('daily');
    expect(BackupLevel.WEEKLY).toBe('weekly');
    expect(BackupLevel.MONTHLY).toBe('monthly');
  });

  it('deve validar tipos de armazenamento', () => {
    expect(BackupStorageType.LOCAL).toBe('local');
    expect(BackupStorageType.S3).toBe('s3');
  });
});
