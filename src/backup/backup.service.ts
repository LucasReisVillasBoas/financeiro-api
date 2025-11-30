import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AuditService, AuditEventType, AuditSeverity } from '../audit/audit.service';
import { LocalStorageStrategy } from './strategies/local-storage.strategy';
import { S3StorageStrategy } from './strategies/s3-storage.strategy';
import {
  BackupType,
  BackupLevel,
  BackupStorageType,
  BackupMetadata,
  BackupResult,
  RestoreResult,
  BackupRetentionPolicy,
} from './interfaces/backup.interface';

const execAsync = promisify(exec);

/**
 * Serviço de Backup do Banco de Dados
 *
 * Responsável por:
 * - Executar backups automáticos (diário, semanal, mensal)
 * - Gerenciar política de retenção multi-nível
 * - Armazenar backups localmente e na nuvem (S3)
 * - Validar e restaurar backups
 */
@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly tempDir = '/tmp/db-backups';
  private isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly localStorageStrategy: LocalStorageStrategy,
    private readonly s3StorageStrategy: S3StorageStrategy,
  ) {
    this.isEnabled = this.configService.get<boolean>('backup.enabled') ?? false;
  }

  async onModuleInit() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    if (this.isEnabled) {
      this.logger.log('Sistema de backup inicializado');
      this.logger.log(
        `Retenção: Diário=${this.getRetentionPolicy().daily.retentionDays}d, ` +
          `Semanal=${this.getRetentionPolicy().weekly.retentionWeeks}sem, ` +
          `Mensal=${this.getRetentionPolicy().monthly.retentionMonths}m`,
      );
    } else {
      this.logger.warn(
        'Sistema de backup está DESABILITADO. Configure BACKUP_ENABLED=true para ativar.',
      );
    }
  }

  /**
   * Backup diário - executa às 02:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyBackup(): Promise<BackupResult> {
    if (!this.isEnabled) return this.disabledResult();
    return this.executeBackup(BackupLevel.DAILY);
  }

  /**
   * Backup semanal - executa aos domingos às 03:00
   */
  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklyBackup(): Promise<BackupResult> {
    if (!this.isEnabled) return this.disabledResult();

    const policy = this.getRetentionPolicy();
    const today = new Date().getDay();

    if (today !== policy.weekly.dayOfWeek) {
      return this.disabledResult();
    }

    return this.executeBackup(BackupLevel.WEEKLY);
  }

  /**
   * Backup mensal - executa no dia configurado às 04:00
   */
  @Cron('0 4 1 * *') // Dia 1 de cada mês às 04:00
  async runMonthlyBackup(): Promise<BackupResult> {
    if (!this.isEnabled) return this.disabledResult();

    const policy = this.getRetentionPolicy();
    const today = new Date().getDate();

    if (today !== policy.monthly.dayOfMonth) {
      return this.disabledResult();
    }

    return this.executeBackup(BackupLevel.MONTHLY);
  }

  /**
   * Executa backup manual
   */
  async executeManualBackup(level: BackupLevel = BackupLevel.DAILY): Promise<BackupResult> {
    return this.executeBackup(level);
  }

  /**
   * Executa o backup do banco de dados
   */
  async executeBackup(level: BackupLevel): Promise<BackupResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Iniciando backup ${level.toUpperCase()}...`);

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dbName = this.configService.get<string>('database.name');
      const filename = `backup_${dbName}_${level}_${timestamp}.sql`;
      const tempFilePath = path.join(this.tempDir, filename);

      // Executar pg_dump
      await this.executePgDump(tempFilePath);

      // Obter tamanho do arquivo
      const stats = fs.statSync(tempFilePath);
      let finalPath = tempFilePath;
      let compressed = false;

      // Comprimir se habilitado
      if (this.configService.get<boolean>('backup.compression.enabled')) {
        finalPath = await this.compressFile(tempFilePath);
        compressed = true;
        fs.unlinkSync(tempFilePath); // Remover arquivo não comprimido
      }

      // Calcular checksum
      const checksum = await this.calculateChecksum(finalPath);

      // Calcular data de expiração baseada na política de retenção
      const expiresAt = this.calculateExpirationDate(level);

      // Criar metadata
      const metadata: BackupMetadata = {
        id: crypto.randomUUID(),
        filename: compressed ? `${filename}.gz` : filename,
        type: BackupType.FULL,
        level,
        storage: BackupStorageType.LOCAL,
        size: fs.statSync(finalPath).size,
        checksum,
        createdAt: new Date(),
        expiresAt,
        databaseName: dbName,
        compressed,
        encrypted: false,
      };

      // Salvar no armazenamento local
      const localEnabled = this.configService.get<boolean>(
        'backup.storage.local.enabled',
      );
      if (localEnabled !== false) {
        await this.localStorageStrategy.save(finalPath, {
          ...metadata,
          storage: BackupStorageType.LOCAL,
        });
      }

      // Salvar no S3 (se habilitado)
      const s3Enabled = this.configService.get<boolean>(
        'backup.storage.s3.enabled',
      );
      if (s3Enabled) {
        await this.s3StorageStrategy.save(finalPath, {
          ...metadata,
          id: crypto.randomUUID(),
          storage: BackupStorageType.S3,
        });
      }

      // Limpar arquivo temporário
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }

      // Executar política de retenção
      await this.applyRetentionPolicy();

      const duration = Date.now() - startTime;

      // Registrar auditoria
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_CREATED,
        severity: AuditSeverity.INFO,
        success: true,
        details: {
          backupId: metadata.id,
          level,
          size: metadata.size,
          duration,
          storage: localEnabled && s3Enabled ? 'local+s3' : localEnabled ? 'local' : 's3',
        },
      });

      this.logger.log(
        `Backup ${level.toUpperCase()} concluído em ${duration}ms - ${this.formatSize(metadata.size)}`,
      );

      return {
        success: true,
        metadata,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Erro no backup ${level}: ${error.message}`);

      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_FAILED,
        severity: AuditSeverity.ERROR,
        success: false,
        errorMessage: error.message,
        details: {
          level,
          duration,
        },
      });

      return {
        success: false,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Restaura um backup
   */
  async restoreBackup(
    backupId: string,
    storage: BackupStorageType = BackupStorageType.LOCAL,
  ): Promise<RestoreResult> {
    const startTime = Date.now();

    try {
      this.logger.warn(`Iniciando restauração do backup ${backupId}...`);

      // Obter arquivo do backup
      const strategy =
        storage === BackupStorageType.LOCAL
          ? this.localStorageStrategy
          : this.s3StorageStrategy;

      const filePath = await strategy.retrieve(backupId);

      // Validar checksum
      const allBackups = await strategy.list();
      const metadata = allBackups.find((b) => b.id === backupId);

      if (!metadata) {
        throw new Error('Metadata do backup não encontrada');
      }

      // Descomprimir se necessário
      let sqlFilePath = filePath;
      if (metadata.compressed) {
        sqlFilePath = await this.decompressFile(filePath);
      }

      // Validar checksum
      const currentChecksum = await this.calculateChecksum(
        metadata.compressed ? filePath : sqlFilePath,
      );
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Checksum inválido - arquivo pode estar corrompido');
      }

      // Executar restauração
      await this.executePgRestore(sqlFilePath);

      // Limpar arquivos temporários
      if (metadata.compressed && sqlFilePath !== filePath) {
        fs.unlinkSync(sqlFilePath);
      }

      const duration = Date.now() - startTime;

      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_RESTORED,
        severity: AuditSeverity.WARNING,
        success: true,
        details: {
          backupId,
          duration,
          databaseName: metadata.databaseName,
        },
      });

      this.logger.log(`Restauração concluída em ${duration}ms`);

      return {
        success: true,
        duration,
        restoredAt: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Erro na restauração: ${error.message}`);

      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_RESTORE_FAILED,
        severity: AuditSeverity.ERROR,
        success: false,
        errorMessage: error.message,
        details: {
          backupId,
          duration,
        },
      });

      return {
        success: false,
        error: error.message,
        duration,
        restoredAt: new Date(),
      };
    }
  }

  /**
   * Testa a restauração de um backup (sem aplicar)
   */
  async testRestore(
    backupId: string,
    storage: BackupStorageType = BackupStorageType.LOCAL,
  ): Promise<RestoreResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Testando restauração do backup ${backupId}...`);

      const strategy =
        storage === BackupStorageType.LOCAL
          ? this.localStorageStrategy
          : this.s3StorageStrategy;

      // Verificar se o backup existe
      const exists = await strategy.exists(backupId);
      if (!exists) {
        throw new Error('Backup não encontrado');
      }

      // Obter arquivo
      const filePath = await strategy.retrieve(backupId);

      // Obter metadata
      const allBackups = await strategy.list();
      const metadata = allBackups.find((b) => b.id === backupId);

      if (!metadata) {
        throw new Error('Metadata do backup não encontrada');
      }

      // Validar checksum
      const currentChecksum = await this.calculateChecksum(filePath);
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Checksum inválido - arquivo pode estar corrompido');
      }

      // Verificar se o arquivo SQL é válido (verificar sintaxe básica)
      let sqlFilePath = filePath;
      if (metadata.compressed) {
        sqlFilePath = await this.decompressFile(filePath);
      }

      const content = fs.readFileSync(sqlFilePath, 'utf-8');
      const hasValidStructure =
        content.includes('PostgreSQL database dump') ||
        content.includes('CREATE TABLE') ||
        content.includes('INSERT INTO');

      if (!hasValidStructure) {
        throw new Error('Arquivo SQL inválido ou corrompido');
      }

      // Limpar arquivos temporários
      if (metadata.compressed && sqlFilePath !== filePath) {
        fs.unlinkSync(sqlFilePath);
      }

      const duration = Date.now() - startTime;

      this.logger.log(`Teste de restauração bem-sucedido em ${duration}ms`);

      return {
        success: true,
        duration,
        restoredAt: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Erro no teste de restauração: ${error.message}`);

      return {
        success: false,
        error: error.message,
        duration,
        restoredAt: new Date(),
      };
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(
    storage?: BackupStorageType,
  ): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];

    if (!storage || storage === BackupStorageType.LOCAL) {
      const localBackups = await this.localStorageStrategy.list();
      backups.push(...localBackups);
    }

    if (!storage || storage === BackupStorageType.S3) {
      const s3Enabled = this.configService.get<boolean>(
        'backup.storage.s3.enabled',
      );
      if (s3Enabled) {
        const s3Backups = await this.s3StorageStrategy.list();
        backups.push(...s3Backups);
      }
    }

    return backups.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * Exclui um backup específico
   */
  async deleteBackup(
    backupId: string,
    storage: BackupStorageType,
  ): Promise<boolean> {
    const strategy =
      storage === BackupStorageType.LOCAL
        ? this.localStorageStrategy
        : this.s3StorageStrategy;

    const result = await strategy.delete(backupId);

    if (result) {
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_DELETED,
        severity: AuditSeverity.WARNING,
        success: true,
        details: { backupId, storage },
      });
    }

    return result;
  }

  /**
   * Aplica política de retenção - remove backups expirados
   */
  async applyRetentionPolicy(): Promise<{ deleted: number; errors: number }> {
    let deleted = 0;
    let errors = 0;
    const now = new Date();

    this.logger.log('Aplicando política de retenção...');

    // Processar backups locais
    const localBackups = await this.localStorageStrategy.list();
    for (const backup of localBackups) {
      if (backup.expiresAt < now) {
        try {
          await this.localStorageStrategy.delete(backup.id);
          deleted++;
          this.logger.log(
            `Backup local expirado removido: ${backup.filename}`,
          );
        } catch {
          errors++;
        }
      }
    }

    // Processar backups S3
    const s3Enabled = this.configService.get<boolean>(
      'backup.storage.s3.enabled',
    );
    if (s3Enabled) {
      const s3Backups = await this.s3StorageStrategy.list();
      for (const backup of s3Backups) {
        if (backup.expiresAt < now) {
          try {
            await this.s3StorageStrategy.delete(backup.id);
            deleted++;
            this.logger.log(`Backup S3 expirado removido: ${backup.filename}`);
          } catch {
            errors++;
          }
        }
      }
    }

    if (deleted > 0) {
      await this.auditService.log({
        timestamp: new Date(),
        eventType: AuditEventType.BACKUP_RETENTION_APPLIED,
        severity: AuditSeverity.INFO,
        success: true,
        details: { deleted, errors },
      });
    }

    this.logger.log(
      `Retenção aplicada: ${deleted} backups removidos, ${errors} erros`,
    );

    return { deleted, errors };
  }

  /**
   * Executa pg_dump para criar o backup
   */
  private async executePgDump(outputPath: string): Promise<void> {
    const dbHost = this.configService.get<string>('database.host');
    const dbPort = this.configService.get<number>('database.port');
    const dbUser = this.configService.get<string>('database.user');
    const dbPassword = this.configService.get<string>('database.password');
    const dbName = this.configService.get<string>('database.name');

    const command = `PGPASSWORD='${dbPassword}' pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f ${outputPath}`;

    await execAsync(command);
  }

  /**
   * Executa pg_restore para restaurar o backup
   */
  private async executePgRestore(inputPath: string): Promise<void> {
    const dbHost = this.configService.get<string>('database.host');
    const dbPort = this.configService.get<number>('database.port');
    const dbUser = this.configService.get<string>('database.user');
    const dbPassword = this.configService.get<string>('database.password');
    const dbName = this.configService.get<string>('database.name');

    // Usar psql para restaurar arquivo SQL plain text
    const command = `PGPASSWORD='${dbPassword}' psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${inputPath}`;

    await execAsync(command);
  }

  /**
   * Comprime um arquivo usando gzip
   */
  private async compressFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`;
    const level =
      this.configService.get<number>('backup.compression.level') || 6;

    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      const gzip = zlib.createGzip({ level });

      input
        .pipe(gzip)
        .pipe(output)
        .on('finish', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  /**
   * Descomprime um arquivo gzip
   */
  private async decompressFile(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.gz', '');

    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      const gunzip = zlib.createGunzip();

      input
        .pipe(gunzip)
        .pipe(output)
        .on('finish', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  /**
   * Calcula checksum SHA256 de um arquivo
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Calcula data de expiração baseada no nível do backup
   */
  private calculateExpirationDate(level: BackupLevel): Date {
    const policy = this.getRetentionPolicy();
    const now = new Date();

    switch (level) {
      case BackupLevel.DAILY:
        return new Date(
          now.getTime() + policy.daily.retentionDays * 24 * 60 * 60 * 1000,
        );
      case BackupLevel.WEEKLY:
        return new Date(
          now.getTime() +
            policy.weekly.retentionWeeks * 7 * 24 * 60 * 60 * 1000,
        );
      case BackupLevel.MONTHLY:
        const expirationDate = new Date(now);
        expirationDate.setMonth(
          expirationDate.getMonth() + policy.monthly.retentionMonths,
        );
        return expirationDate;
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Retorna a política de retenção configurada
   */
  private getRetentionPolicy(): BackupRetentionPolicy {
    return {
      daily: {
        enabled:
          this.configService.get<boolean>('backup.retention.daily.enabled') ??
          true,
        retentionDays:
          this.configService.get<number>(
            'backup.retention.daily.retentionDays',
          ) ?? 30,
      },
      weekly: {
        enabled:
          this.configService.get<boolean>('backup.retention.weekly.enabled') ??
          true,
        retentionWeeks:
          this.configService.get<number>(
            'backup.retention.weekly.retentionWeeks',
          ) ?? 12,
        dayOfWeek:
          this.configService.get<number>(
            'backup.retention.weekly.dayOfWeek',
          ) ?? 0,
      },
      monthly: {
        enabled:
          this.configService.get<boolean>('backup.retention.monthly.enabled') ??
          true,
        retentionMonths:
          this.configService.get<number>(
            'backup.retention.monthly.retentionMonths',
          ) ?? 12,
        dayOfMonth:
          this.configService.get<number>(
            'backup.retention.monthly.dayOfMonth',
          ) ?? 1,
      },
    };
  }

  private disabledResult(): BackupResult {
    return {
      success: false,
      error: 'Sistema de backup desabilitado',
      duration: 0,
    };
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
