import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContaBancaria } from '../entities/conta-bancaria/conta-bancaria.entity';
import { ContaBancariaController } from './conta-bancaria.controller';
import { ContaBancariaService } from './conta-bancaria.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContaBancaria])],
  controllers: [ContaBancariaController],
  providers: [ContaBancariaService],
  exports: [ContaBancariaService],
})
export class ContaBancariaModule {}
