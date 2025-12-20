import { CreateEmpresaDto } from './create-empresa.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContatoFilialDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do contato' })
  @IsNotEmpty({ message: 'Nome do contato é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome!: string;

  @ApiProperty({ example: 'joao@empresa.com', description: 'E-mail do contato' })
  @IsNotEmpty({ message: 'E-mail do contato é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiPropertyOptional({ example: '(11) 3333-3333', description: 'Telefone fixo' })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999', description: 'Celular' })
  @IsOptional()
  @IsString({ message: 'Celular deve ser uma string' })
  celular?: string;

  @ApiPropertyOptional({ example: 'Gerente', description: 'Função/cargo do contato' })
  @IsOptional()
  @IsString({ message: 'Função deve ser uma string' })
  funcao?: string;
}

export class CreateFilialDto extends CreateEmpresaDto {
  @ApiProperty({ description: 'UUID da empresa sede' })
  @IsNotEmpty({ message: 'ID da empresa sede é obrigatório' })
  @IsString({ message: 'ID da empresa sede deve ser uma string' })
  @IsUUID('4', { message: 'ID da empresa sede deve ser um UUID válido' })
  empresa_id!: string;

  @ApiPropertyOptional({
    description: 'Dados do contato da filial (opcional)',
    type: ContatoFilialDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContatoFilialDto)
  contato?: ContatoFilialDto;
}
