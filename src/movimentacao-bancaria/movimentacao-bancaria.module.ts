import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MovimentacoesBancarias } from '../entities/movimentacao-bancaria/movimentacao-bancaria.entity';
import { ContasBancarias } from '../entities/conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancariasController } from './movimentacao-bancaria.controller';
import { MovimentacoesBancariasService } from './movimentacao-bancaria.service';

@Module({
  imports: [MikroOrmModule.forFeature([MovimentacoesBancarias, ContasBancarias])],
  controllers: [MovimentacoesBancariasController],
  providers: [MovimentacoesBancariasService],
  exports: [MovimentacoesBancariasService],
})
export class MovimentacoesBancariasModule {}
