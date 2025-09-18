import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsuarioPerfilDto {
  @ApiProperty({ example: true })
  ativo?: boolean;
}
