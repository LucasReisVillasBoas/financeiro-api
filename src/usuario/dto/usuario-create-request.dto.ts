import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Cidade } from '../../entities/cidade/cidade.entity';
import { Contato } from '../../entities/contato/contato.entity';

export class UsuarioCreateRequestDto {
  @ApiProperty({ example: 'email@email.com' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail deve ser um endereço válido' })
  @MaxLength(255, { message: 'E-mail deve ter no máximo 255 caracteres' })
  email: string;

  @ApiProperty({ example: 'email@email.com' })
  @IsNotEmpty({ message: 'Login é obrigatório' })
  @IsString({ message: 'Login deve ser uma string' })
  @MinLength(3, { message: 'Login deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Login deve ter no máximo 100 caracteres' })
  login: string;

  @ApiProperty({ example: '123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  senha: string;

  @ApiProperty({ example: 'Joao Silva' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  nome: string;

  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  telefone: string;

  @ApiProperty({ example: 'teste' })
  @IsNotEmpty({ message: 'Cargo é obrigatório' })
  @IsString({ message: 'Cargo deve ser uma string' })
  @MinLength(2, { message: 'Cargo deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Cargo deve ter no máximo 100 caracteres' })
  cargo: string;

  @ApiProperty({ example: '123' })
  @IsNotEmpty({ message: 'Status ativo é obrigatório' })
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo: boolean;

  @ApiProperty({ example: '', required: false })
  @IsOptional()
  cidade?: Cidade;

  @IsOptional()
  @ApiProperty({ example: [], required: false, type: [String] })
  @IsArray({ message: 'Contatos deve ser um array' })
  contatos?: Contato[];
}
