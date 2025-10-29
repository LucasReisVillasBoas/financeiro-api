import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimentacoesBancariasDto } from './create-movimentacao-bancaria.dto';

export class UpdateMovimentacoesBancariasDto extends PartialType(
  CreateMovimentacoesBancariasDto,
) {}
