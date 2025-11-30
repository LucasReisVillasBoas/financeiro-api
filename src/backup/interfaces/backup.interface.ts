/**
 * Interfaces para o sistema de backup
 */

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
}

export enum BackupLevel {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum BackupStorageType {
  LOCAL = 'local',
  S3 = 's3',
}

export interface BackupMetadata {
  id: string;
  filename: string;
  type: BackupType;
  level: BackupLevel;
  storage: BackupStorageType;
  size: number;
  checksum: string;
  createdAt: Date;
  expiresAt: Date;
  databaseName: string;
  compressed: boolean;
  encrypted: boolean;
}

export interface BackupResult {
  success: boolean;
  metadata?: BackupMetadata;
  error?: string;
  duration: number;
}

export interface RestoreResult {
  success: boolean;
  error?: string;
  duration: number;
  restoredAt: Date;
}

export interface BackupRetentionPolicy {
  daily: {
    enabled: boolean;
    retentionDays: number;
  };
  weekly: {
    enabled: boolean;
    retentionWeeks: number;
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  };
  monthly: {
    enabled: boolean;
    retentionMonths: number;
    dayOfMonth: number;
  };
}

export interface BackupStorageStrategy {
  type: BackupStorageType;
  save(filepath: string, metadata: BackupMetadata): Promise<string>;
  retrieve(backupId: string): Promise<string>;
  delete(backupId: string): Promise<boolean>;
  list(): Promise<BackupMetadata[]>;
  exists(backupId: string): Promise<boolean>;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily: string; // cron expression
    weekly: string;
    monthly: string;
  };
  retention: BackupRetentionPolicy;
  storage: {
    local: {
      enabled: boolean;
      path: string;
    };
    s3: {
      enabled: boolean;
      bucket: string;
      region: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
  compression: {
    enabled: boolean;
    level: number;
  };
  notifications: {
    enabled: boolean;
    onSuccess: boolean;
    onFailure: boolean;
    email?: string;
  };
}
