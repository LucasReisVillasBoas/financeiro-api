import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePessoaDto {
  @ApiProperty({ description: 'ID da empresa' })
  @IsUUID('4', { message: 'Empresa ID deve ser um UUID válido' })
  empresaId!: string;

  @ApiProperty({ description: 'ID do endereço' })
  @IsUUID('4', { message: 'Endereço ID deve ser um UUID válido' })
  enderecoId!: string;

  @ApiProperty({
    description: 'Razão social ou nome completo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Razão/Nome deve ser um texto' })
  @MaxLength(60, { message: 'Razão/Nome deve ter no máximo 60 caracteres' })
  razaoNome?: string;

  @ApiProperty({ description: 'Nome fantasia ou apelido', required: false })
  @IsOptional()
  @IsString({ message: 'Fantasia/Apelido deve ser um texto' })
  @MaxLength(60, {
    message: 'Fantasia/Apelido deve ter no máximo 60 caracteres',
  })
  fantasiaApelido?: string;

  @ApiProperty({ description: 'CPF ou CNPJ', required: false })
  @IsOptional()
  @IsString({ message: 'Documento deve ser um texto' })
  @MinLength(11, { message: 'Documento deve ter no mínimo 11 caracteres' })
  @MaxLength(14, { message: 'Documento deve ter no máximo 14 caracteres' })
  documento?: string;

  @ApiProperty({ description: 'Inscrição Estadual ou RG', required: false })
  @IsOptional()
  @IsString({ message: 'IE/RG deve ser um texto' })
  @MaxLength(14, { message: 'IE/RG deve ter no máximo 14 caracteres' })
  ieRg?: string;

  @ApiProperty({ description: 'Data de aniversário', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Aniversário deve ser uma data válida' })
  aniversario?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsString({ message: 'Email deve ser um texto' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  email?: string;

  @ApiProperty({ description: 'Telefone', required: false })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser um texto' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  telefone?: string;

  @ApiProperty({ description: 'Pessoa ativa ou inativa', default: true })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
