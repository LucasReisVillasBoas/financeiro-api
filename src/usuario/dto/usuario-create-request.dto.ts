import { ApiProperty } from '@nestjs/swagger';

export class UsuarioCreateRequestDto {
  @ApiProperty({ example: 'email@email.com' })
  email: string;

  @ApiProperty({ example: 'email@email.com' })
  login: string;

  @ApiProperty({ example: '123' })
  senha: string;

  @ApiProperty({ example: 'Joao Silva' })
  nome: string;

  @ApiProperty({ example: '1234567890' })
  telefone: string;

  @ApiProperty({ example: 'teste' })
  cargo: string;

  @ApiProperty({ example: '123' })
  ativo: boolean;
}
