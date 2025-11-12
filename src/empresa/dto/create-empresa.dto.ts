import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateEmpresaDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Cliente ID é obrigatório' })
  @IsString({ message: 'Cliente ID deve ser uma string' })
  cliente_id!: string;

  @ApiProperty({ example: 'Empresa LTDA' })
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  @IsString({ message: 'Razão social deve ser uma string' })
  @MinLength(3, { message: 'Razão social deve ter no mínimo 3 caracteres' })
  @MaxLength(255, { message: 'Razão social deve ter no máximo 255 caracteres' })
  razao_social!: string;

  @ApiProperty({ example: 'Nome Fantasia' })
  @IsNotEmpty({ message: 'Nome fantasia é obrigatório' })
  @IsString({ message: 'Nome fantasia deve ser uma string' })
  @MinLength(3, { message: 'Nome fantasia deve ter no mínimo 3 caracteres' })
  @MaxLength(255, {
    message: 'Nome fantasia deve ter no máximo 255 caracteres',
  })
  nome_fantasia!: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsNotEmpty({ message: 'CNPJ/CPF é obrigatório' })
  @IsString({ message: 'CNPJ/CPF deve ser uma string' })
  cnpj_cpf!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Inscrição estadual deve ser uma string' })
  @MaxLength(50, {
    message: 'Inscrição estadual deve ter no máximo 50 caracteres',
  })
  inscricao_estadual?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Inscrição municipal deve ser uma string' })
  @MaxLength(50, {
    message: 'Inscrição municipal deve ter no máximo 50 caracteres',
  })
  inscricao_municipal?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  @Matches(/^\d{5}-?\d{3}$/, { message: 'CEP deve estar no formato 00000-000' })
  cep?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Logradouro deve ser uma string' })
  @MaxLength(255, { message: 'Logradouro deve ter no máximo 255 caracteres' })
  logradouro?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Número deve ser uma string' })
  @MaxLength(20, { message: 'Número deve ter no máximo 20 caracteres' })
  numero?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Bairro deve ser uma string' })
  @MaxLength(100, { message: 'Bairro deve ter no máximo 100 caracteres' })
  bairro?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Complemento deve ser uma string' })
  @MaxLength(100, { message: 'Complemento deve ter no máximo 100 caracteres' })
  complemento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  cidade?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Código IBGE deve ser uma string' })
  @MaxLength(20, { message: 'Código IBGE deve ter no máximo 20 caracteres' })
  codigo_ibge?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'UF deve ser uma string' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'UF deve ter 2 letras maiúsculas (ex: SP, RJ)',
  })
  uf?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  telefone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'Celular deve ser uma string' })
  @MaxLength(20, { message: 'Celular deve ter no máximo 20 caracteres' })
  celular?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail deve ser um endereço válido' })
  @MaxLength(255, { message: 'E-mail deve ter no máximo 255 caracteres' })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Data de abertura deve ser uma data válida' })
  data_abertura?: Date;
}
