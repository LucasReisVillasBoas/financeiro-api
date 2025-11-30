import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { LocalStorageStrategy } from './strategies/local-storage.strategy';
import { S3StorageStrategy } from './strategies/s3-storage.strategy';

/**
 * Módulo de Backup
 *
 * Fornece funcionalidades de backup automático do banco de dados:
 * - Backups programados (diário, semanal, mensal)
 * - Armazenamento local e em nuvem (S3)
 * - Política de retenção configurável
 * - Restauração com validação de integridade
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
    LocalStorageStrategy,
    S3StorageStrategy,
  ],
  exports: [BackupService],
})
export class BackupModule {}
