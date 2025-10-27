import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContaReceber } from '../entities/conta-receber/conta-receber.entity';
import { ContaReceberController } from './conta-receber.controller';
import { ContaReceberService } from './conta-receber.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContaReceber])],
  controllers: [ContaReceberController],
  providers: [ContaReceberService],
  exports: [ContaReceberService],
})
export class ContaReceberModule {}
