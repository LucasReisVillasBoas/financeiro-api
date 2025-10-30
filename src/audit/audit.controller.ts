import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditoriaRepository } from './audit.repository';
import { AuditQueryDto } from './dto/audit-query.dto';
import {
  AuditoriaResponseDto,
  AuditoriaPaginatedResponseDto,
  AuditoriaStatisticsDto,
} from './dto/audit-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../decorators/roles.decorator';

/**
 * Controller de Auditoria
 *
 * IMPORTANTE: Todos os endpoints são restritos a usuários com perfil ADMIN
 * Dados de auditoria são IMUTÁVEIS - não há endpoints de UPDATE ou DELETE
 */
@ApiTags('Auditoria')
@ApiBearerAuth()
@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
export class AuditoriaController {
  constructor(private readonly auditoriaRepository: AuditoriaRepository) {}

  /**
   * Listar registros de auditoria com filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar registros de auditoria',
    description:
      'Retorna lista paginada de registros de auditoria com filtros opcionais. ' +
      'Acesso restrito a administradores. Dados são IMUTÁVEIS.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de registros de auditoria',
    type: AuditoriaPaginatedResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado - Apenas administradores',
  })
  async findAll(
    @Query() query: AuditQueryDto,
  ): Promise<AuditoriaPaginatedResponseDto> {
    const { data, total } = await this.auditoriaRepository.findWithFilters({
      usuarioId: query.usuarioId,
      empresaId: query.empresaId,
      modulo: query.modulo,
      acao: query.acao,
      resultado: query.resultado,
      dataInicio: query.dataInicio,
      dataFim: query.dataFim,
      limit: query.limit || 100,
      offset: query.offset || 0,
    });

    return {
      data: data.map((item) => AuditoriaResponseDto.fromEntity(item)),
      total,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  /**
   * Buscar logs de um usuário específico
   */
  @Get('usuario/:usuarioId')
  @ApiOperation({
    summary: 'Buscar logs de um usuário',
    description:
      'Retorna todos os registros de auditoria relacionados a um usuário específico. ' +
      'Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs do usuário',
    type: [AuditoriaResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de registros',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset para paginação',
    example: 0,
  })
  async findByUsuario(
    @Param('usuarioId') usuarioId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditoriaResponseDto[]> {
    const logs = await this.auditoriaRepository.findByUsuario(
      usuarioId,
      limit || 100,
      offset || 0,
    );
    return logs.map((log) => AuditoriaResponseDto.fromEntity(log));
  }

  /**
   * Buscar logs de uma empresa específica
   */
  @Get('empresa/:empresaId')
  @ApiOperation({
    summary: 'Buscar logs de uma empresa',
    description:
      'Retorna todos os registros de auditoria relacionados a uma empresa específica. ' +
      'Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs da empresa',
    type: [AuditoriaResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de registros',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset para paginação',
    example: 0,
  })
  async findByEmpresa(
    @Param('empresaId') empresaId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditoriaResponseDto[]> {
    const logs = await this.auditoriaRepository.findByEmpresa(
      empresaId,
      limit || 100,
      offset || 0,
    );
    return logs.map((log) => AuditoriaResponseDto.fromEntity(log));
  }

  /**
   * Buscar logs por módulo
   */
  @Get('modulo/:modulo')
  @ApiOperation({
    summary: 'Buscar logs por módulo',
    description:
      'Retorna todos os registros de auditoria de um módulo específico ' +
      '(ex: USUARIO, EMPRESA, AUTH). Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs do módulo',
    type: [AuditoriaResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de registros',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset para paginação',
    example: 0,
  })
  async findByModulo(
    @Param('modulo') modulo: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditoriaResponseDto[]> {
    const logs = await this.auditoriaRepository.findByModulo(
      modulo,
      limit || 100,
      offset || 0,
    );
    return logs.map((log) => AuditoriaResponseDto.fromEntity(log));
  }

  /**
   * Buscar logs por ação
   */
  @Get('acao/:acao')
  @ApiOperation({
    summary: 'Buscar logs por ação',
    description:
      'Retorna todos os registros de auditoria de uma ação específica ' +
      '(ex: CREATE, UPDATE, DELETE, LOGIN). Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de logs da ação',
    type: [AuditoriaResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de registros',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset para paginação',
    example: 0,
  })
  async findByAcao(
    @Param('acao') acao: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<AuditoriaResponseDto[]> {
    const logs = await this.auditoriaRepository.findByAcao(
      acao,
      limit || 100,
      offset || 0,
    );
    return logs.map((log) => AuditoriaResponseDto.fromEntity(log));
  }

  /**
   * Obter estatísticas de auditoria
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Estatísticas de auditoria',
    description:
      'Retorna estatísticas agregadas dos logs de auditoria, incluindo ' +
      'totais por resultado, módulo e ação. Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas de auditoria',
    type: AuditoriaStatisticsDto,
  })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    type: Date,
    description: 'Data inicial do período',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    type: Date,
    description: 'Data final do período',
  })
  @ApiQuery({
    name: 'empresaId',
    required: false,
    type: String,
    description: 'Filtrar por empresa',
  })
  @ApiQuery({
    name: 'usuarioId',
    required: false,
    type: String,
    description: 'Filtrar por usuário',
  })
  async getStatistics(
    @Query('dataInicio') dataInicio?: Date,
    @Query('dataFim') dataFim?: Date,
    @Query('empresaId') empresaId?: string,
    @Query('usuarioId') usuarioId?: string,
  ): Promise<AuditoriaStatisticsDto> {
    return this.auditoriaRepository.getStatistics({
      dataInicio,
      dataFim,
      empresaId,
      usuarioId,
    });
  }

  /**
   * Buscar um registro específico por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar registro de auditoria por ID',
    description:
      'Retorna um registro específico de auditoria. ' +
      'Acesso restrito a administradores.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registro de auditoria',
    type: AuditoriaResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Registro não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<AuditoriaResponseDto | null> {
    const log = await this.auditoriaRepository.findOne({ id });
    return log ? AuditoriaResponseDto.fromEntity(log) : null;
  }
}
