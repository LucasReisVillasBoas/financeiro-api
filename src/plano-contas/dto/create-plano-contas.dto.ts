import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  Matches,
  Validate,
} from 'class-validator';
import { TipoPlanoContas } from '../../entities/plano-contas/plano-contas.entity';
import { CodigoMaskValidator } from '../validators/codigo-mask.validator';

export class CreatePlanoContasDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Empresa ID é obrigatório' })
  empresaId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @MaxLength(50, { message: 'Código deve ter no máximo 50 caracteres' })
  @Matches(/^[0-9.]+$/, {
    message: 'Código deve conter apenas números e pontos (ex: 1.1.01)',
  })
  @Validate(CodigoMaskValidator)
  codigo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MaxLength(255, { message: 'Descrição deve ter no máximo 255 caracteres' })
  descricao!: string;

  @IsEnum(TipoPlanoContas, {
    message: 'Tipo deve ser: Receita, Custo, Despesa ou Outros',
  })
  tipo!: TipoPlanoContas;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsInt({ message: 'Nível deve ser um número inteiro' })
  @Min(1, { message: 'Nível deve ser maior ou igual a 1' })
  nivel!: number;

  @IsOptional()
  @IsBoolean()
  permite_lancamento?: boolean;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
