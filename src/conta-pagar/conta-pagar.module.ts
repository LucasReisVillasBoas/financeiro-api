import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContasPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContasPagarController } from './conta-pagar.controller';
import { ContasPagarService } from './conta-pagar.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContasPagar])],
  controllers: [ContasPagarController],
  providers: [ContasPagarService],
  exports: [ContasPagarService],
})
export class ContaPagarModule {}
