import { ApiProperty } from '@nestjs/swagger';

export class UsuarioCreateRequestDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  login: string;

  @ApiProperty()
  senha: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  telefone: string;

  @ApiProperty()
  cargo: string;

  @ApiProperty()
  ativo: boolean;
}
