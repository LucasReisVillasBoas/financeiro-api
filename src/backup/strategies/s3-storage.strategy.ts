import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as crypto from 'crypto';
import {
  BackupStorageStrategy,
  BackupStorageType,
  BackupMetadata,
} from '../interfaces/backup.interface';

/**
 * Estratégia de armazenamento S3 para backups
 *
 * Implementação usando chamadas HTTP diretas (sem SDK AWS)
 * para manter o projeto leve. Em produção, considere usar @aws-sdk/client-s3
 */
@Injectable()
export class S3StorageStrategy implements BackupStorageStrategy {
  readonly type = BackupStorageType.S3;
  private readonly logger = new Logger(S3StorageStrategy.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly metadataKey = 'backup-metadata.json';

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('backup.storage.s3.bucket');
    this.region =
      this.configService.get<string>('backup.storage.s3.region') || 'us-east-1';
    this.accessKeyId = this.configService.get<string>(
      'backup.storage.s3.accessKeyId',
    );
    this.secretAccessKey = this.configService.get<string>(
      'backup.storage.s3.secretAccessKey',
    );
  }

  async save(filepath: string, metadata: BackupMetadata): Promise<string> {
    const s3Key = `${metadata.level}/${metadata.filename}`;

    try {
      const fileContent = fs.readFileSync(filepath);
      await this.putObject(s3Key, fileContent);

      // Atualizar metadata no S3
      await this.saveMetadata(metadata);

      const s3Url = `s3://${this.bucket}/${s3Key}`;
      this.logger.log(
        `Backup enviado para S3: ${s3Url} (${this.formatSize(metadata.size)})`,
      );

      return s3Url;
    } catch (error) {
      this.logger.error(`Erro ao enviar backup para S3: ${error.message}`);
      throw error;
    }
  }

  async retrieve(backupId: string): Promise<string> {
    const allMetadata = await this.loadAllMetadata();
    const metadata = allMetadata.find((m) => m.id === backupId);

    if (!metadata) {
      throw new Error(`Backup não encontrado no S3: ${backupId}`);
    }

    const s3Key = `${metadata.level}/${metadata.filename}`;
    const tempDir = '/tmp/backup-restore';

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const localPath = path.join(tempDir, metadata.filename);
    const content = await this.getObject(s3Key);
    fs.writeFileSync(localPath, content);

    this.logger.log(`Backup baixado do S3: ${localPath}`);
    return localPath;
  }

  async delete(backupId: string): Promise<boolean> {
    try {
      const allMetadata = await this.loadAllMetadata();
      const metadata = allMetadata.find((m) => m.id === backupId);

      if (!metadata) {
        this.logger.warn(
          `Backup não encontrado no S3 para exclusão: ${backupId}`,
        );
        return false;
      }

      const s3Key = `${metadata.level}/${metadata.filename}`;
      await this.deleteObject(s3Key);

      // Atualizar metadata
      const updatedMetadata = allMetadata.filter((m) => m.id !== backupId);
      await this.saveAllMetadata(updatedMetadata);

      this.logger.log(`Backup excluído do S3: ${backupId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao excluir backup do S3: ${error.message}`);
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

    const s3Key = `${metadata.level}/${metadata.filename}`;
    return this.objectExists(s3Key);
  }

  private async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const allMetadata = await this.loadAllMetadata();
    allMetadata.push(metadata);
    await this.saveAllMetadata(allMetadata);
  }

  private async loadAllMetadata(): Promise<BackupMetadata[]> {
    try {
      const content = await this.getObject(this.metadataKey);
      const data = JSON.parse(content.toString());
      return data.map((item: BackupMetadata) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
      }));
    } catch {
      return [];
    }
  }

  private async saveAllMetadata(metadata: BackupMetadata[]): Promise<void> {
    const content = JSON.stringify(metadata, null, 2);
    await this.putObject(this.metadataKey, Buffer.from(content));
  }

  /**
   * Implementação simplificada de assinatura AWS v4
   * Em produção, use @aws-sdk/client-s3
   */
  private getSignatureHeaders(
    method: string,
    s3Key: string,
    contentHash: string,
  ): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const canonicalUri = `/${s3Key}`;
    const canonicalQuerystring = '';
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      contentHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto
      .createHmac('sha256', `AWS4${this.secretAccessKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto
      .createHmac('sha256', kDate)
      .update(this.region)
      .digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update('s3')
      .digest();
    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    const signature = crypto
      .createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    const authorizationHeader = `${algorithm} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': contentHash,
      Authorization: authorizationHeader,
      Host: host,
    };
  }

  private async putObject(key: string, content: Buffer): Promise<void> {
    const contentHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
    const headers = this.getSignatureHeaders('PUT', key, contentHash);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: `${this.bucket}.s3.${this.region}.amazonaws.com`,
        path: `/${key}`,
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Length': content.length,
          'Content-Type': 'application/octet-stream',
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`S3 PUT falhou com status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(content);
      req.end();
    });
  }

  private async getObject(key: string): Promise<Buffer> {
    const contentHash =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty hash
    const headers = this.getSignatureHeaders('GET', key, contentHash);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: `${this.bucket}.s3.${this.region}.amazonaws.com`,
        path: `/${key}`,
        method: 'GET',
        headers,
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 404) {
          reject(new Error('Objeto não encontrado no S3'));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });

      req.on('error', reject);
      req.end();
    });
  }

  private async deleteObject(key: string): Promise<void> {
    const contentHash =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const headers = this.getSignatureHeaders('DELETE', key, contentHash);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: `${this.bucket}.s3.${this.region}.amazonaws.com`,
        path: `/${key}`,
        method: 'DELETE',
        headers,
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`S3 DELETE falhou com status ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  private async objectExists(key: string): Promise<boolean> {
    const contentHash =
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const headers = this.getSignatureHeaders('HEAD', key, contentHash);

    return new Promise((resolve) => {
      const options = {
        hostname: `${this.bucket}.s3.${this.region}.amazonaws.com`,
        path: `/${key}`,
        method: 'HEAD',
        headers,
      };

      const req = https.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.end();
    });
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
