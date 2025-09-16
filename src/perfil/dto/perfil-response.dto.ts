import { ApiProperty } from '@nestjs/swagger';

export class PerfilResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  clienteId!: number;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  permissoes!: Record<string, string[]>;

  @ApiProperty()
  ativo!: boolean;
}
