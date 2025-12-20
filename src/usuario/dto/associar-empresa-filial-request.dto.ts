import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssociarEmpresaFilialRequestDto {
  @ApiProperty({ example: '001', required: false })
  @IsOptional()
  @IsString({ message: 'Empresa ID deve ser uma string' })
  empresaId?: string;

  @ApiProperty({ example: '002', required: false })
  @IsOptional()
  @IsString({ message: 'Filial ID deve ser uma string' })
  filialId?: string;
}
