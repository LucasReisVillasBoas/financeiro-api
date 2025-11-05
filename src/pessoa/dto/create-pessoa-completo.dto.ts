import { IsString, IsOptional, IsUUID, IsBoolean, IsDateString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoPessoa {
  FISICA = 'Física',
  JURIDICA = 'Jurídica',
}

export class CreatePessoaCompletoDto {
  @ApiProperty({ description: 'ID do cliente (empresa)' })
  @IsUUID('4', { message: 'Cliente ID deve ser um UUID válido' })
  clienteId!: string;

  @ApiProperty({ description: 'Tipo de pessoa', enum: TipoPessoa })
  @IsEnum(TipoPessoa, { message: 'Tipo deve ser Física ou Jurídica' })
  tipo!: TipoPessoa;

  @ApiProperty({ description: 'Nome completo ou razão social' })
  @IsString({ message: 'Nome deve ser um texto' })
  @MaxLength(60, { message: 'Nome deve ter no máximo 60 caracteres' })
  nome!: string;

  @ApiProperty({ description: 'CPF ou CNPJ' })
  @IsString({ message: 'CPF/CNPJ deve ser um texto' })
  cpf_cnpj!: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Telefone fixo', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ description: 'Celular', required: false })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({ description: 'CEP' })
  @IsString({ message: 'CEP deve ser um texto' })
  cep!: string;

  @ApiProperty({ description: 'Logradouro' })
  @IsString({ message: 'Logradouro deve ser um texto' })
  logradouro!: string;

  @ApiProperty({ description: 'Número' })
  @IsString({ message: 'Número deve ser um texto' })
  numero!: string;

  @ApiProperty({ description: 'Complemento', required: false })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ description: 'Bairro' })
  @IsString({ message: 'Bairro deve ser um texto' })
  bairro!: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString({ message: 'Cidade deve ser um texto' })
  cidade!: string;

  @ApiProperty({ description: 'UF (estado)' })
  @IsString({ message: 'UF deve ser um texto' })
  @MaxLength(2, { message: 'UF deve ter 2 caracteres' })
  uf!: string;

  @ApiProperty({ description: 'Código IBGE da cidade', required: false })
  @IsOptional()
  @IsString()
  codigoIbge?: string;

  @ApiProperty({ description: 'Pessoa ativa ou inativa', default: true })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;

  @ApiProperty({ description: 'Observações', required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
