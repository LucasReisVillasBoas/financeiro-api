import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BackupLevel, BackupStorageType } from '../interfaces/backup.interface';

export class CreateBackupDto {
  @ApiPropertyOptional({
    description: 'Nível do backup',
    enum: BackupLevel,
    default: BackupLevel.DAILY,
  })
  @IsOptional()
  @IsEnum(BackupLevel)
  level?: BackupLevel = BackupLevel.DAILY;
}

export class RestoreBackupDto {
  @ApiProperty({
    description: 'ID do backup a ser restaurado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  backupId: string;

  @ApiPropertyOptional({
    description: 'Tipo de armazenamento onde o backup está',
    enum: BackupStorageType,
    default: BackupStorageType.LOCAL,
  })
  @IsOptional()
  @IsEnum(BackupStorageType)
  storage?: BackupStorageType = BackupStorageType.LOCAL;
}

export class DeleteBackupDto {
  @ApiProperty({
    description: 'ID do backup a ser excluído',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  backupId: string;

  @ApiProperty({
    description: 'Tipo de armazenamento onde o backup está',
    enum: BackupStorageType,
  })
  @IsEnum(BackupStorageType)
  storage: BackupStorageType;
}

export class ListBackupsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de armazenamento',
    enum: BackupStorageType,
  })
  @IsOptional()
  @IsEnum(BackupStorageType)
  storage?: BackupStorageType;

  @ApiPropertyOptional({
    description: 'Filtrar por nível de backup',
    enum: BackupLevel,
  })
  @IsOptional()
  @IsEnum(BackupLevel)
  level?: BackupLevel;
}

export class BackupResponseDto {
  @ApiProperty({ description: 'Operação foi bem-sucedida' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Mensagem de erro se houver falha' })
  error?: string;

  @ApiPropertyOptional({ description: 'Duração da operação em ms' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Metadata do backup criado' })
  metadata?: {
    id: string;
    filename: string;
    type: string;
    level: string;
    storage: string;
    size: number;
    checksum: string;
    createdAt: Date;
    expiresAt: Date;
    databaseName: string;
    compressed: boolean;
    encrypted: boolean;
  };
}

export class RestoreResponseDto {
  @ApiProperty({ description: 'Restauração foi bem-sucedida' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Mensagem de erro se houver falha' })
  error?: string;

  @ApiPropertyOptional({ description: 'Duração da operação em ms' })
  duration?: number;

  @ApiProperty({ description: 'Data/hora da restauração' })
  restoredAt: Date;
}

export class BackupMetadataResponseDto {
  @ApiProperty({ description: 'ID único do backup' })
  id: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  filename: string;

  @ApiProperty({ description: 'Tipo do backup', enum: ['full', 'incremental'] })
  type: string;

  @ApiProperty({ description: 'Nível do backup', enum: BackupLevel })
  level: BackupLevel;

  @ApiProperty({ description: 'Tipo de armazenamento', enum: BackupStorageType })
  storage: BackupStorageType;

  @ApiProperty({ description: 'Tamanho em bytes' })
  size: number;

  @ApiProperty({ description: 'Checksum SHA256' })
  checksum: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de expiração' })
  expiresAt: Date;

  @ApiProperty({ description: 'Nome do banco de dados' })
  databaseName: string;

  @ApiProperty({ description: 'Se está comprimido' })
  compressed: boolean;

  @ApiProperty({ description: 'Se está criptografado' })
  encrypted: boolean;
}

export class RetentionResultDto {
  @ApiProperty({ description: 'Quantidade de backups excluídos' })
  deleted: number;

  @ApiProperty({ description: 'Quantidade de erros' })
  errors: number;
}
