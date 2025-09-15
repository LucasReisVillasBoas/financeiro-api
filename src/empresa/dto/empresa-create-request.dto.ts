import { ApiProperty } from '@nestjs/swagger';

export class EmpresaCreateRequestDto {
  @ApiProperty()
  razaoSocial: string;

  @ApiProperty({ required: false })
  nomeFantasia?: string;

  @ApiProperty()
  cnpjCpf: string;

  @ApiProperty({ required: false })
  inscricaoEstadual?: string;

  @ApiProperty({ required: false })
  inscricaoMunicipal?: string;

  @ApiProperty({ required: false })
  site?: string;

  @ApiProperty()
  endereco_id: number;

  @ApiProperty({ required: false })
  matrizId?: number;

  @ApiProperty({ required: false })
  matrizFilial?: string;

  @ApiProperty()
  abertura: string; // date string ISO format
}
