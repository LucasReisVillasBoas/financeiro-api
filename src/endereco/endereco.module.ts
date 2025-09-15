import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Endereco } from '../entities/endereco/endereco.entity';

@Global()
@Module({
  imports: [MikroOrmModule.forFeature([Endereco])],
  // providers: [EnderecoService],
  // controllers: [EnderecoController],
  // exports: [EnderecoService],
})
export class EnderecoModule {}
