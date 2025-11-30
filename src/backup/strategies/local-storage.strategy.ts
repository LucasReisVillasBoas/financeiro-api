import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  BackupStorageStrategy,
  BackupStorageType,
  BackupMetadata,
} from '../interfaces/backup.interface';

/**
 * Estratégia de armazenamento local para backups
 *
 * Salva os backups no sistema de arquivos local
 * com organização por nível (diário, semanal, mensal)
 */
@Injectable()
export class LocalStorageStrategy implements BackupStorageStrategy {
  readonly type = BackupStorageType.LOCAL;
  private readonly logger = new Logger(LocalStorageStrategy.name);
  private readonly basePath: string;
  private readonly metadataFile = 'backup-metadata.json';

  constructor(private readonly configService: ConfigService) {
    this.basePath =
      this.configService.get<string>('backup.storage.local.path') ||
      './backups';
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const directories = ['daily', 'weekly', 'monthly'];
    directories.forEach((dir) => {
      const fullPath = path.join(this.basePath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Diretório de backup criado: ${fullPath}`);
      }
    });
  }

  async save(filepath: string, metadata: BackupMetadata): Promise<string> {
    const destDir = path.join(this.basePath, metadata.level);
    const destPath = path.join(destDir, metadata.filename);

    try {
      // Copiar arquivo para o diretório de destino
      fs.copyFileSync(filepath, destPath);

      // Salvar metadata
      await this.saveMetadata(metadata);

      this.logger.log(
        `Backup salvo localmente: ${destPath} (${this.formatSize(metadata.size)})`,
      );

      return destPath;
    } catch (error) {
      this.logger.error(`Erro ao salvar backup local: ${error.message}`);
      throw error;
    }
  }

  async retrieve(backupId: string): Promise<string> {
    const allMetadata = await this.loadAllMetadata();
    const metadata = allMetadata.find((m) => m.id === backupId);

    if (!metadata) {
      throw new Error(`Backup não encontrado: ${backupId}`);
    }

    const filePath = path.join(this.basePath, metadata.level, metadata.filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de backup não encontrado: ${filePath}`);
    }

    return filePath;
  }

  async delete(backupId: string): Promise<boolean> {
    try {
      const allMetadata = await this.loadAllMetadata();
      const metadata = allMetadata.find((m) => m.id === backupId);

      if (!metadata) {
        this.logger.warn(`Backup não encontrado para exclusão: ${backupId}`);
        return false;
      }

      const filePath = path.join(
        this.basePath,
        metadata.level,
        metadata.filename,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remover metadata
      const updatedMetadata = allMetadata.filter((m) => m.id !== backupId);
      await this.saveAllMetadata(updatedMetadata);

      this.logger.log(`Backup excluído: ${backupId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao excluir backup: ${error.message}`);
      return false;
    }
  }

  async list(): Promise<BackupMetadata[]> {
    return this.loadAllMetadata();
  }

  async exists(backupId: string): Promise<boolean> {
    const allMetadata = await this.loadAllMetadata();
    const metadata = allMetadata.find((m) => m.id === backupId);

    if (!metadata) return false;

    const filePath = path.join(this.basePath, metadata.level, metadata.filename);
    return fs.existsSync(filePath);
  }

  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const allMetadata = await this.loadAllMetadata();
    allMetadata.push(metadata);
    await this.saveAllMetadata(allMetadata);
  }

  private async loadAllMetadata(): Promise<BackupMetadata[]> {
    const metadataPath = path.join(this.basePath, this.metadataFile);

    if (!fs.existsSync(metadataPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const data = JSON.parse(content);
      return data.map((item: BackupMetadata) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
      }));
    } catch {
      this.logger.warn('Erro ao carregar metadata, retornando array vazio');
      return [];
    }
  }

  private async saveAllMetadata(metadata: BackupMetadata[]): Promise<void> {
    const metadataPath = path.join(this.basePath, this.metadataFile);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
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
