import { PartialType } from '@nestjs/swagger';
import { CreateFilialDto } from './create-filial.dto';
import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateFilialDto extends PartialType(CreateEmpresaDto) {}
