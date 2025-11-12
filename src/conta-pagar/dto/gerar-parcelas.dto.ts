import {
  IsString,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  IsNotEmpty,
  IsInt,
  IsOptional,
} from 'class-validator';
import { TipoContaPagar } from '../../entities/conta-pagar/conta-pagar.entity';

export class GerarParcelasDto {
  @IsString()
  @IsNotEmpty({ message: 'Documento é obrigatório' })
  documento!: string;

  @IsOptional()
  @IsString()
  serie?: string;

  @IsEnum(TipoContaPagar, {
    message:
      'Tipo deve ser: Fornecedor, Empréstimo, Imposto, Salário, Aluguel, Serviço ou Outros',
  })
  tipo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  descricao!: string;

  @IsDateString({}, { message: 'Data de emissão deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de emissão é obrigatória' })
  data_emissao!: string;

  @IsDateString({}, { message: 'Data de lançamento deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de lançamento é obrigatória' })
  data_lancamento!: string;

  @IsDateString(
    {},
    { message: 'Vencimento da primeira parcela deve ser uma data válida' },
  )
  @IsNotEmpty({ message: 'Vencimento da primeira parcela é obrigatório' })
  primeiro_vencimento!: string;

  @IsNumber({}, { message: 'Valor total deve ser um número' })
  @Min(0.01, { message: 'Valor total deve ser maior que zero' })
  valor_total!: number;

  @IsInt({ message: 'Número de parcelas deve ser um número inteiro' })
  @Min(1, { message: 'Número de parcelas deve ser no mínimo 1' })
  numero_parcelas!: number;

  @IsInt({ message: 'Intervalo entre parcelas deve ser um número inteiro' })
  @Min(1, { message: 'Intervalo entre parcelas deve ser no mínimo 1 dia' })
  intervalo_dias: number = 30; // Default 30 dias (mensal)

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Acréscimos não podem ser negativos' })
  acrescimos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Descontos não podem ser negativos' })
  descontos?: number;

  @IsUUID('4', { message: 'ID da pessoa inválido' })
  @IsNotEmpty({ message: 'Pessoa é obrigatória' })
  pessoaId!: string;

  @IsUUID('4', { message: 'ID do plano de contas inválido' })
  @IsNotEmpty({ message: 'Plano de contas é obrigatório' })
  planoContasId!: string;

  @IsUUID('4', { message: 'ID da empresa inválido' })
  @IsNotEmpty({ message: 'Empresa é obrigatória' })
  empresaId!: string;
}
