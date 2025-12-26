import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsArray,
  IsString,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export class CidadeUpdateDto {
  @ApiProperty({ example: 'São Paulo', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  nome: string;

  @ApiProperty({ example: '3550308', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigoIbge?: string;

  @ApiProperty({ example: 'SP', required: false })
  @IsOptional()
  @IsString()
  @IsIn(UFS, { message: 'UF inválida. Deve ser uma sigla de estado brasileiro válida' })
  uf?: string;

  @ApiProperty({ example: '1058', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigoBacen?: string;
}

export class UsuarioUpdateRequestDto {
  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiProperty({ example: 'Senha@123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Senha deve conter pelo menos 1 letra maiúscula, 1 número e 1 caractere especial',
  })
  senha?: string;

  @ApiProperty({ example: 'Joao Silva', required: false })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ example: 'teste', required: false })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({ example: 'uuid-da-cidade', required: false })
  @IsOptional()
  @IsUUID()
  cidadeId?: string;

  @ApiProperty({
    example: { nome: 'São Paulo', uf: 'SP', codigoIbge: '3550308' },
    required: false,
    description: 'Dados da cidade para criar caso não exista',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CidadeUpdateDto)
  cidade?: CidadeUpdateDto;

  @ApiProperty({
    example: ['uuid-contato-1', 'uuid-contato-2'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contatoIds?: string[];
}
