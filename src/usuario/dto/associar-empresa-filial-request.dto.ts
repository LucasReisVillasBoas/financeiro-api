import { ApiProperty } from '@nestjs/swagger';

export class AssociarEmpresaFilialRequestDto {
  @ApiProperty({ example: '001', required: false })
  empresaId?: string;

  @ApiProperty({ example: '002', required: false })
  filialId?: string;
}
