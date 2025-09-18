import { ApiProperty } from '@nestjs/swagger';

export class AssociarEmpresaFilialRequestDto {
  @ApiProperty({ example: '001' })
  empresaId?: string;
}
