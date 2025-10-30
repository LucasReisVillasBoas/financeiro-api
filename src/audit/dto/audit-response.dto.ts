import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Auditoria } from '../../entities/auditoria/auditoria.entity';

export class AuditoriaResponseDto {
  @ApiProperty({
    description: 'ID do registro de auditoria',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'ID do usuário que executou a ação',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  usuario_id?: string;

  @ApiProperty({
    description: 'Ação executada',
    example: 'DELETE',
  })
  acao: string;

  @ApiProperty({
    description: 'Módulo/Recurso afetado',
    example: 'USUARIO',
  })
  modulo: string;

  @ApiPropertyOptional({
    description: 'ID da empresa/filial relacionada',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  empresa_id?: string;

  @ApiProperty({
    description: 'Data e hora da ação',
    example: '2025-10-30T12:34:56.789Z',
    type: Date,
  })
  data_hora: Date;

  @ApiProperty({
    description: 'Resultado da operação',
    enum: ['SUCESSO', 'FALHA', 'NEGADO'],
    example: 'SUCESSO',
  })
  resultado: 'SUCESSO' | 'FALHA' | 'NEGADO';

  @ApiPropertyOptional({
    description: 'Endereço IP de origem',
    example: '192.168.1.100',
  })
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'User Agent do navegador/cliente',
    example: 'Mozilla/5.0...',
  })
  user_agent?: string;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais da ação',
    example: { campo_alterado: 'email', valor_anterior: 'antigo@email.com' },
  })
  detalhes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Mensagem de erro (quando resultado = FALHA)',
    example: 'Usuário não tem permissão',
  })
  mensagem_erro?: string;

  static fromEntity(auditoria: Auditoria): AuditoriaResponseDto {
    const dto = new AuditoriaResponseDto();
    dto.id = auditoria.id;
    dto.usuario_id = auditoria.usuario?.id;
    dto.acao = auditoria.acao;
    dto.modulo = auditoria.modulo;
    dto.empresa_id = auditoria.empresa?.id;
    dto.data_hora = auditoria.data_hora;
    dto.resultado = auditoria.resultado;
    dto.ip_address = auditoria.ip_address;
    dto.user_agent = auditoria.user_agent;
    dto.detalhes = auditoria.detalhes;
    dto.mensagem_erro = auditoria.mensagem_erro;
    return dto;
  }
}

export class AuditoriaPaginatedResponseDto {
  @ApiProperty({
    description: 'Lista de registros de auditoria',
    type: [AuditoriaResponseDto],
  })
  data: AuditoriaResponseDto[];

  @ApiProperty({
    description: 'Total de registros encontrados',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Limite de registros por página',
    example: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Offset atual',
    example: 0,
  })
  offset: number;
}

export class AuditoriaStatisticsDto {
  @ApiProperty({
    description: 'Total de registros',
    example: 1500,
  })
  total: number;

  @ApiProperty({
    description: 'Total de operações bem-sucedidas',
    example: 1200,
  })
  sucesso: number;

  @ApiProperty({
    description: 'Total de falhas',
    example: 50,
  })
  falha: number;

  @ApiProperty({
    description: 'Total de acessos negados',
    example: 250,
  })
  negado: number;

  @ApiProperty({
    description: 'Estatísticas por módulo',
    example: { USUARIO: 500, EMPRESA: 300, AUTH: 700 },
  })
  porModulo: Record<string, number>;

  @ApiProperty({
    description: 'Estatísticas por ação',
    example: { CREATE: 400, UPDATE: 300, DELETE: 100, LOGIN: 700 },
  })
  porAcao: Record<string, number>;
}
