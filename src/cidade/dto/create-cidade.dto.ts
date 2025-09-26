import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  Matches,
  IsIn,
} from 'class-validator';
import { IsValidIBGE } from '../../validators/ibge.validator';

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export class CreateCidadeDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  filialId?: string;

  @IsString()
  @Length(1, 255)
  nome!: string;

  @IsString()
  @Length(7, 7)
  @IsValidIBGE({
    message:
      'Código IBGE inválido. Deve ter 7 dígitos numéricos com dígito verificador válido',
  })
  codigoIbge!: string;

  @IsString()
  @Length(2, 2)
  @IsIn(UFS, {
    message: 'UF inválida. Deve ser uma sigla de estado brasileiro válida',
  })
  uf!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  pais?: string = 'Brasil';

  @IsOptional()
  @IsString()
  @Length(1, 10)
  @Matches(/^[0-9]+$/, {
    message: 'Código BACEN deve conter apenas números',
  })
  codigoBacen?: string;
}
