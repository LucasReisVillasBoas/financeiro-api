import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContasReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContasReceberController } from './conta-receber.controller';
import { ContasReceberService } from './conta-receber.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContasReceber])],
  controllers: [ContasReceberController],
  providers: [ContasReceberService],
  exports: [ContasReceberService],
})
export class ContasReceberModule {}
