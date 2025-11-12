import { Module, Global } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuditService } from './audit.service';
import { AuditoriaController } from './audit.controller';
import { Auditoria } from '../entities/auditoria/auditoria.entity';
import { AuditoriaRepository } from './audit.repository';

/**
 * Módulo de Auditoria
 *
 * Marcado como @Global para estar disponível em toda a aplicação
 * sem precisar importar em cada módulo que precisa registrar logs
 */
@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Auditoria])],
  controllers: [AuditoriaController],
  providers: [AuditService, AuditoriaRepository],
  exports: [AuditService, AuditoriaRepository],
})
export class AuditModule {}
