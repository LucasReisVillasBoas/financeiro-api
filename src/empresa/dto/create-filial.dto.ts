import { CreateEmpresaDto } from './create-empresa.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFilialDto extends CreateEmpresaDto {
  @ApiProperty({ description: 'UUID da empresa sede' })
  empresa_id!: string;
}
