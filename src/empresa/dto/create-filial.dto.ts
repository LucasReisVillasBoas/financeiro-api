import { ApiProperty } from '@nestjs/swagger';

export class CreateFilialDto {
  @ApiProperty()
  empresa_id!: string;

  @ApiProperty({ example: 'Razão Social Filial' })
  razao_social!: string;

  @ApiProperty({ example: 'Nome Fantasia Filial' })
  nome_fantasia!: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  cnpj_cpf!: string;

  @ApiProperty({ required: false })
  inscricao_estadual?: string;

  @ApiProperty({ required: false })
  inscricao_municipal?: string;

  // demais campos opcionais...
  @ApiProperty({ required: false })
  email?: string;
}
