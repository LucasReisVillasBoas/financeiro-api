import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty()
  cliente_id!: string;

  @ApiProperty({ example: 'Empresa LTDA' })
  razao_social!: string;

  @ApiProperty({ example: 'Nome Fantasia' })
  nome_fantasia!: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  cnpj_cpf!: string;

  @ApiProperty({ required: false })
  inscricao_estadual?: string;

  @ApiProperty({ required: false })
  inscricao_municipal?: string;

  @ApiProperty({ required: false })
  cep?: string;

  @ApiProperty({ required: false })
  logradouro?: string;

  @ApiProperty({ required: false })
  numero?: string;

  @ApiProperty({ required: false })
  bairro?: string;

  @ApiProperty({ required: false })
  complemento?: string;

  @ApiProperty({ required: false })
  cidade?: string;

  @ApiProperty({ required: false })
  codigo_ibge?: string;

  @ApiProperty({ required: false })
  uf?: string;

  @ApiProperty({ required: false })
  telefone?: string;

  @ApiProperty({ required: false })
  celular?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  data_abertura?: Date;
}
