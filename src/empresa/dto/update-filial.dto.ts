import { PartialType } from '@nestjs/swagger';
import { CreateFilialDto } from './create-filial.dto';

export class UpdateFilialDto extends PartialType(CreateFilialDto) {}
