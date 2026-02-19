import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateBackupDto,
  RestoreBackupDto,
  DeleteBackupDto,
  ListBackupsQueryDto,
  BackupResponseDto,
  RestoreResponseDto,
  BackupMetadataResponseDto,
  RetentionResultDto,
} from './dto/backup.dto';
import { BackupLevel } from './interfaces/backup.interface';

/**
 * Controller de Backup
 *
 * Endpoints para gerenciamento de backups do banco de dados.
 * Acesso restrito a usuários com perfil ADMIN.
 */
@ApiTags('Backup')
@ApiBearerAuth()
@Controller('backup')
@UseGuards(RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @Roles('Administrador')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar backup manual do banco de dados' })
  @ApiResponse({
    status: 201,
    description: 'Backup criado com sucesso',
    type: BackupResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 500, description: 'Erro ao criar backup' })
  async createBackup(@Body() dto: CreateBackupDto): Promise<BackupResponseDto> {
    const result = await this.backupService.executeManualBackup(
      dto.level || BackupLevel.DAILY,
    );

    return {
      success: result.success,
      error: result.error,
      duration: result.duration,
      metadata: result.metadata
        ? {
            id: result.metadata.id,
            filename: result.metadata.filename,
            type: result.metadata.type,
            level: result.metadata.level,
            storage: result.metadata.storage,
            size: result.metadata.size,
            checksum: result.metadata.checksum,
            createdAt: result.metadata.createdAt,
            expiresAt: result.metadata.expiresAt,
            databaseName: result.metadata.databaseName,
            compressed: result.metadata.compressed,
            encrypted: result.metadata.encrypted,
          }
        : undefined,
    };
  }

  @Get()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Listar todos os backups disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de backups',
    type: [BackupMetadataResponseDto],
  })
  async listBackups(
    @Query() query: ListBackupsQueryDto,
  ): Promise<BackupMetadataResponseDto[]> {
    let backups = await this.backupService.listBackups(query.storage);

    if (query.level) {
      backups = backups.filter((b) => b.level === query.level);
    }

    return backups;
  }

  @Post('restore')
  @Roles('Administrador')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar backup do banco de dados',
    description:
      'ATENÇÃO: Esta operação irá sobrescrever os dados atuais do banco!',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup restaurado com sucesso',
    type: RestoreResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Backup não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro na restauração' })
  async restoreBackup(
    @Body() dto: RestoreBackupDto,
  ): Promise<RestoreResponseDto> {
    return this.backupService.restoreBackup(dto.backupId, dto.storage);
  }

  @Post('test-restore')
  @Roles('Administrador')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Testar restauração de backup (sem aplicar)',
    description: 'Valida integridade do backup sem executar a restauração',
  })
  @ApiResponse({
    status: 200,
    description: 'Teste de restauração concluído',
    type: RestoreResponseDto,
  })
  async testRestore(
    @Body() dto: RestoreBackupDto,
  ): Promise<RestoreResponseDto> {
    return this.backupService.testRestore(dto.backupId, dto.storage);
  }

  @Delete()
  @Roles('Administrador')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir um backup específico' })
  @ApiResponse({ status: 200, description: 'Backup excluído' })
  @ApiResponse({ status: 404, description: 'Backup não encontrado' })
  async deleteBackup(
    @Body() dto: DeleteBackupDto,
  ): Promise<{ success: boolean }> {
    const success = await this.backupService.deleteBackup(
      dto.backupId,
      dto.storage,
    );
    return { success };
  }

  @Post('retention')
  @Roles('Administrador')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Executar política de retenção manualmente',
    description:
      'Remove backups expirados de acordo com a política configurada',
  })
  @ApiResponse({
    status: 200,
    description: 'Política de retenção aplicada',
    type: RetentionResultDto,
  })
  async applyRetention(): Promise<RetentionResultDto> {
    return this.backupService.applyRetentionPolicy();
  }

  @Get('status')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Obter status do sistema de backup' })
  @ApiResponse({ status: 200, description: 'Status do sistema' })
  async getStatus(): Promise<{
    enabled: boolean;
    lastBackup: BackupMetadataResponseDto | null;
    totalBackups: {
      local: number;
      s3: number;
    };
    storageUsed: {
      local: number;
      s3: number;
    };
  }> {
    const backups = await this.backupService.listBackups();

    const localBackups = backups.filter((b) => b.storage === 'local');
    const s3Backups = backups.filter((b) => b.storage === 's3');

    const lastBackup = backups.length > 0 ? backups[0] : null;

    return {
      enabled: this.backupService.getIsEnabled(),
      lastBackup,
      totalBackups: {
        local: localBackups.length,
        s3: s3Backups.length,
      },
      storageUsed: {
        local: localBackups.reduce((sum, b) => sum + b.size, 0),
        s3: s3Backups.reduce((sum, b) => sum + b.size, 0),
      },
    };
  }
}
