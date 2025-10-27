import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MovimentacaoBancaria } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { MovimentacaoBancariaController } from './movimentacao-bancaria.controller';
import { MovimentacaoBancariaService } from './movimentacao-bancaria.service';

@Module({
  imports: [MikroOrmModule.forFeature([MovimentacaoBancaria])],
  controllers: [MovimentacaoBancariaController],
  providers: [MovimentacaoBancariaService],
  exports: [MovimentacaoBancariaService],
})
export class MovimentacaoBancariaModule {}
