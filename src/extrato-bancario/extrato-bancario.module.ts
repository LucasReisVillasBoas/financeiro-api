import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MulterModule } from '@nestjs/platform-express';
import { ExtratoBancario } from '../entities/extrato-bancario/extrato-bancario.entity';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { ExtratoBancarioController } from './extrato-bancario.controller';
import { ExtratoBancarioService } from './extrato-bancario.service';
import { OfxParser } from './parsers/ofx.parser';
import { CsvParser } from './parsers/csv.parser';
import { MatchingService } from './matching.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([ExtratoBancario, MovimentacoesBancarias, ContasBancarias]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    AuditModule,
  ],
  controllers: [ExtratoBancarioController],
  providers: [
    ExtratoBancarioService,
    OfxParser,
    CsvParser,
    MatchingService,
  ],
  exports: [ExtratoBancarioService],
})
export class ExtratoBancarioModule {}
