import { PartialType } from '@nestjs/mapped-types';
import { CreateBaixaRecebimentoDto } from './create-baixa-recebimento.dto';

export class UpdateBaixaRecebimentoDto extends PartialType(CreateBaixaRecebimentoDto) {}
