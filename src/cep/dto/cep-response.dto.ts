import { ApiProperty } from '@nestjs/swagger';

export class CepResponseDto {
  @ApiProperty({ example: '01310-100', description: 'CEP formatado' })
  cep: string;

  @ApiProperty({ example: 'Avenida Paulista', description: 'Logradouro' })
  logradouro: string;

  @ApiProperty({ example: 'até 610 - lado par', description: 'Complemento' })
  complemento: string;

  @ApiProperty({ example: 'Bela Vista', description: 'Bairro' })
  bairro: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade' })
  cidade: string;

  @ApiProperty({ example: 'SP', description: 'UF (Estado)' })
  uf: string;

  @ApiProperty({ example: '3550308', description: 'Código IBGE da cidade' })
  ibge: string;

  @ApiProperty({ example: '1004', description: 'Código DDD' })
  ddd: string;
}

export class CepErrorDto {
  @ApiProperty({ example: 'CEP não encontrado' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;
}
