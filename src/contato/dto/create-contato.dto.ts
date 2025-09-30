import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateContatoDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  filialId?: string;

  @IsString()
  nome!: string;

  @IsString()
  funcao!: string;

  @IsString()
  telefone!: string;

  @IsString()
  celular!: string;

  @IsString()
  email!: string;
}