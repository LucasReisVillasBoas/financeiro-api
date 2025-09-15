import { ApiProperty } from '@nestjs/swagger';

export class EmpresaResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  data: any;

  constructor(message: string, statusCode: number, data: any) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }
}
