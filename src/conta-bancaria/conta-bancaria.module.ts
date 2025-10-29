import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { ContaBancariaController } from './conta-bancaria.controller';
import { ContasBancariasService } from './conta-bancaria.service';

@Module({
  imports: [MikroOrmModule.forFeature([ContasBancarias])],
  controllers: [ContaBancariaController],
  providers: [ContasBancariasService],
  exports: [ContasBancariasService],
})
export class ContaBancariaModule {}
