import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContaPagar } from '../entities/conta-pagar/conta-pagar.entity';
import { ContaPagarController } from './conta-pagar.controller';
import { ContaPagarService } from './conta-pagar.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContaPagar])],
  controllers: [ContaPagarController],
  providers: [ContaPagarService],
  exports: [ContaPagarService],
})
export class ContaPagarModule {}
