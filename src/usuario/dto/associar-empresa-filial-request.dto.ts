import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssociarEmpresaFilialRequestDto {
  @ApiProperty({ example: '001', required: false })
  @IsOptional()
  @IsString()
  empresaId?: string;

  @ApiProperty({ example: '002', required: false })
  @IsOptional()
  @IsString()
  filialId?: string;
}
