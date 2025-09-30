import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';

export class UsuarioUpdateRequestDto {
  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'email@email.com', required: false })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiProperty({ example: '123', required: false })
  @IsOptional()
  @IsString()
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
    example: ['uuid-contato-1', 'uuid-contato-2'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contatoIds?: string[];
}
