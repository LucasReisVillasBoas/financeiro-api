import { Test, TestingModule } from '@nestjs/testing';
import { BackupController } from '../../src/backup/backup.controller';
import { BackupService } from '../../src/backup/backup.service';
import { RolesGuard } from '../../src/auth/roles.guard';
import {
  BackupLevel,
  BackupStorageType,
  BackupType,
  BackupMetadata,
} from '../../src/backup/interfaces/backup.interface';

describe('BackupController', () => {
  let controller: BackupController;
  let backupService: BackupService;

  const createMockMetadata = (overrides?: Partial<BackupMetadata>): BackupMetadata => ({
    id: 'backup-uuid-123',
    filename: 'backup_test_daily_2024-01-01.sql.gz',
    type: BackupType.FULL,
    level: BackupLevel.DAILY,
    storage: BackupStorageType.LOCAL,
    size: 2048,
    checksum: 'sha256checksum',
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-01-31'),
    databaseName: 'test_db',
    compressed: true,
    encrypted: false,
    ...overrides,
  });

  const mockBackupService = {
    executeManualBackup: jest.fn(),
    listBackups: jest.fn(),
    restoreBackup: jest.fn(),
    testRestore: jest.fn(),
    deleteBackup: jest.fn(),
    applyRetentionPolicy: jest.fn(),
    getIsEnabled: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupController],
      providers: [
        { provide: BackupService, useValue: mockBackupService },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BackupController>(BackupController);
    backupService = module.get<BackupService>(BackupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /backup (createBackup)', () => {
    it('deve criar backup com sucesso', async () => {
      const metadata = createMockMetadata();
      mockBackupService.executeManualBackup.mockResolvedValue({
        success: true,
        duration: 150,
        metadata,
      });

      const result = await controller.createBackup({ level: BackupLevel.DAILY });

      expect(result.success).toBe(true);
      expect(result.duration).toBe(150);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.id).toBe('backup-uuid-123');
      expect(mockBackupService.executeManualBackup).toHaveBeenCalledWith(BackupLevel.DAILY);
    });

    it('deve usar nivel DAILY como padrao', async () => {
      mockBackupService.executeManualBackup.mockResolvedValue({
        success: true,
        duration: 100,
        metadata: createMockMetadata(),
      });

      await controller.createBackup({});

      expect(mockBackupService.executeManualBackup).toHaveBeenCalledWith(BackupLevel.DAILY);
    });

    it('deve retornar erro quando backup falha', async () => {
      mockBackupService.executeManualBackup.mockResolvedValue({
        success: false,
        error: 'pg_dump failed',
        duration: 50,
      });

      const result = await controller.createBackup({ level: BackupLevel.DAILY });

      expect(result.success).toBe(false);
      expect(result.error).toBe('pg_dump failed');
      expect(result.metadata).toBeUndefined();
    });

    it('deve aceitar nivel WEEKLY', async () => {
      mockBackupService.executeManualBackup.mockResolvedValue({
        success: true,
        duration: 200,
        metadata: createMockMetadata({ level: BackupLevel.WEEKLY }),
      });

      const result = await controller.createBackup({ level: BackupLevel.WEEKLY });

      expect(mockBackupService.executeManualBackup).toHaveBeenCalledWith(BackupLevel.WEEKLY);
      expect(result.metadata.level).toBe(BackupLevel.WEEKLY);
    });

    it('deve aceitar nivel MONTHLY', async () => {
      mockBackupService.executeManualBackup.mockResolvedValue({
        success: true,
        duration: 300,
        metadata: createMockMetadata({ level: BackupLevel.MONTHLY }),
      });

      const result = await controller.createBackup({ level: BackupLevel.MONTHLY });

      expect(mockBackupService.executeManualBackup).toHaveBeenCalledWith(BackupLevel.MONTHLY);
      expect(result.metadata.level).toBe(BackupLevel.MONTHLY);
    });
  });

  describe('GET /backup (listBackups)', () => {
    it('deve listar backups sem filtros', async () => {
      const backups = [createMockMetadata()];
      mockBackupService.listBackups.mockResolvedValue(backups);

      const result = await controller.listBackups({});

      expect(result).toHaveLength(1);
      expect(mockBackupService.listBackups).toHaveBeenCalledWith(undefined);
    });

    it('deve filtrar por storage', async () => {
      const backups = [createMockMetadata()];
      mockBackupService.listBackups.mockResolvedValue(backups);

      const result = await controller.listBackups({ storage: BackupStorageType.LOCAL });

      expect(mockBackupService.listBackups).toHaveBeenCalledWith(BackupStorageType.LOCAL);
    });

    it('deve filtrar por nivel', async () => {
      const backups = [
        createMockMetadata({ level: BackupLevel.DAILY }),
        createMockMetadata({ id: 'weekly', level: BackupLevel.WEEKLY }),
      ];
      mockBackupService.listBackups.mockResolvedValue(backups);

      const result = await controller.listBackups({ level: BackupLevel.DAILY });

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(BackupLevel.DAILY);
    });

    it('deve retornar lista vazia quando nao ha backups', async () => {
      mockBackupService.listBackups.mockResolvedValue([]);

      const result = await controller.listBackups({});

      expect(result).toHaveLength(0);
    });
  });

  describe('POST /backup/restore (restoreBackup)', () => {
    it('deve restaurar backup com sucesso', async () => {
      mockBackupService.restoreBackup.mockResolvedValue({
        success: true,
        duration: 500,
        restoredAt: new Date(),
      });

      const result = await controller.restoreBackup({
        backupId: 'backup-uuid-123',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(true);
      expect(result.restoredAt).toBeDefined();
      expect(mockBackupService.restoreBackup).toHaveBeenCalledWith(
        'backup-uuid-123',
        BackupStorageType.LOCAL,
      );
    });

    it('deve retornar erro quando restauracao falha', async () => {
      mockBackupService.restoreBackup.mockResolvedValue({
        success: false,
        error: 'Checksum invalido',
        duration: 100,
        restoredAt: new Date(),
      });

      const result = await controller.restoreBackup({
        backupId: 'backup-uuid-123',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Checksum invalido');
    });
  });

  describe('POST /backup/test-restore (testRestore)', () => {
    it('deve testar restauracao com sucesso', async () => {
      mockBackupService.testRestore.mockResolvedValue({
        success: true,
        duration: 200,
        restoredAt: new Date(),
      });

      const result = await controller.testRestore({
        backupId: 'backup-uuid-123',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(true);
      expect(mockBackupService.testRestore).toHaveBeenCalledWith(
        'backup-uuid-123',
        BackupStorageType.LOCAL,
      );
    });

    it('deve retornar falha quando teste detecta problemas', async () => {
      mockBackupService.testRestore.mockResolvedValue({
        success: false,
        error: 'Arquivo SQL invalido',
        duration: 50,
        restoredAt: new Date(),
      });

      const result = await controller.testRestore({
        backupId: 'backup-uuid-123',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Arquivo SQL invalido');
    });
  });

  describe('DELETE /backup (deleteBackup)', () => {
    it('deve excluir backup com sucesso', async () => {
      mockBackupService.deleteBackup.mockResolvedValue(true);

      const result = await controller.deleteBackup({
        backupId: 'backup-uuid-123',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(true);
      expect(mockBackupService.deleteBackup).toHaveBeenCalledWith(
        'backup-uuid-123',
        BackupStorageType.LOCAL,
      );
    });

    it('deve retornar false quando backup nao encontrado', async () => {
      mockBackupService.deleteBackup.mockResolvedValue(false);

      const result = await controller.deleteBackup({
        backupId: 'backup-inexistente',
        storage: BackupStorageType.LOCAL,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('POST /backup/retention (applyRetention)', () => {
    it('deve aplicar politica de retencao com sucesso', async () => {
      mockBackupService.applyRetentionPolicy.mockResolvedValue({
        deleted: 3,
        errors: 0,
      });

      const result = await controller.applyRetention();

      expect(result.deleted).toBe(3);
      expect(result.errors).toBe(0);
      expect(mockBackupService.applyRetentionPolicy).toHaveBeenCalled();
    });

    it('deve retornar erros quando exclusao parcial falha', async () => {
      mockBackupService.applyRetentionPolicy.mockResolvedValue({
        deleted: 2,
        errors: 1,
      });

      const result = await controller.applyRetention();

      expect(result.deleted).toBe(2);
      expect(result.errors).toBe(1);
    });
  });

  describe('GET /backup/status (getStatus)', () => {
    it('deve retornar status do sistema com backups', async () => {
      const backups = [
        createMockMetadata({ storage: BackupStorageType.LOCAL, size: 1024 }),
        createMockMetadata({ id: 'b2', storage: BackupStorageType.LOCAL, size: 2048 }),
        createMockMetadata({ id: 'b3', storage: BackupStorageType.S3, size: 4096 }),
      ];
      mockBackupService.listBackups.mockResolvedValue(backups);
      mockBackupService.getIsEnabled.mockReturnValue(true);

      const result = await controller.getStatus();

      expect(result.enabled).toBe(true);
      expect(result.lastBackup).toBeDefined();
      expect(result.totalBackups.local).toBe(2);
      expect(result.totalBackups.s3).toBe(1);
      expect(result.storageUsed.local).toBe(3072);
      expect(result.storageUsed.s3).toBe(4096);
    });

    it('deve retornar status vazio quando nao ha backups', async () => {
      mockBackupService.listBackups.mockResolvedValue([]);
      mockBackupService.getIsEnabled.mockReturnValue(true);

      const result = await controller.getStatus();

      expect(result.enabled).toBe(true);
      expect(result.lastBackup).toBeNull();
      expect(result.totalBackups.local).toBe(0);
      expect(result.totalBackups.s3).toBe(0);
    });

    it('deve retornar enabled false quando backup esta desabilitado', async () => {
      mockBackupService.listBackups.mockResolvedValue([]);
      mockBackupService.getIsEnabled.mockReturnValue(false);

      const result = await controller.getStatus();

      expect(result.enabled).toBe(false);
    });
  });
});
