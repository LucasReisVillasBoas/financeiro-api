import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePerfilDto } from './create-perfil.dto';

export class UpdatePerfilDto extends PartialType(CreatePerfilDto) {
  @ApiProperty({ required: false, description: 'Novo nome do perfil' })
  nome?: string;

  @ApiProperty({ required: false, description: 'Novas permissões do perfil' })
  permissoes?: Record<string, string[]>;
}
