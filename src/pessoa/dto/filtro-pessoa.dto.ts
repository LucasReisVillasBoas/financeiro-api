import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FiltroPessoaDto {
  @ApiProperty({ description: 'ID da empresa para filtrar', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'Empresa ID deve ser um UUID válido' })
  empresaId?: string;

  @ApiProperty({ description: 'Buscar por razão social ou nome', required: false })
  @IsOptional()
  @IsString({ message: 'Razão/Nome deve ser um texto' })
  razaoNome?: string;

  @ApiProperty({ description: 'Buscar por nome fantasia ou apelido', required: false })
  @IsOptional()
  @IsString({ message: 'Fantasia/Apelido deve ser um texto' })
  fantasiaApelido?: string;

  @ApiProperty({ description: 'Buscar por documento (CPF/CNPJ)', required: false })
  @IsOptional()
  @IsString({ message: 'Documento deve ser um texto' })
  documento?: string;

  @ApiProperty({ description: 'Filtrar por status ativo', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
