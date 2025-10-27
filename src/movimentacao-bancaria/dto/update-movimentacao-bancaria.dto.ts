import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimentacaoBancariaDto } from './create-movimentacao-bancaria.dto';

export class UpdateMovimentacaoBancariaDto extends PartialType(
  CreateMovimentacaoBancariaDto,
) {}
