import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Min,
  IsInt,
  IsNotEmpty,
  MinLength,
  Validate,
} from 'class-validator';
import {
  StatusContaPagar,
  TipoContaPagar,
} from '../../entities/conta-pagar/conta-pagar.entity';
import { IsDataOrdemValida } from '../validators/data-ordem.validator';

export class CreateContaPagarDto {
  // Campos obrigatórios
  @IsString()
  @IsNotEmpty({ message: 'Documento é obrigatório' })
  @MinLength(1, { message: 'Documento deve ter pelo menos 1 caractere' })
  documento!: string;

  @IsOptional()
  @IsString()
  serie?: string;

  @IsInt({ message: 'Parcela deve ser um número inteiro' })
  @Min(1, { message: 'Parcela deve ser no mínimo 1' })
  parcela!: number;

  @IsEnum(TipoContaPagar, {
    message:
      'Tipo deve ser: Fornecedor, Empréstimo, Imposto, Salário, Aluguel, Serviço ou Outros',
  })
  tipo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  descricao!: string;

  // Datas obrigatórias
  @IsDateString({}, { message: 'Data de emissão deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de emissão é obrigatória' })
  data_emissao!: string;

  @IsDateString({}, { message: 'Vencimento deve ser uma data válida' })
  @IsNotEmpty({ message: 'Vencimento é obrigatório' })
  vencimento!: string;

  @IsDateString({}, { message: 'Data de lançamento deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de lançamento é obrigatória' })
  data_lancamento!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de liquidação deve ser uma data válida' })
  @IsDataOrdemValida()
  data_liquidacao?: string;

  // Valores
  @IsNumber({}, { message: 'Valor principal deve ser um número' })
  @Min(0.01, { message: 'Valor principal deve ser maior que zero' })
  valor_principal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Acréscimos não podem ser negativos' })
  acrescimos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Descontos não podem ser negativos' })
  descontos?: number;

  // Relacionamentos obrigatórios
  @IsUUID('4', { message: 'ID da pessoa inválido' })
  @IsNotEmpty({ message: 'Pessoa é obrigatória' })
  pessoaId!: string;

  @IsUUID('4', { message: 'ID do plano de contas inválido' })
  @IsNotEmpty({ message: 'Plano de contas é obrigatório' })
  planoContasId!: string;

  @IsUUID('4', { message: 'ID da empresa inválido' })
  @IsNotEmpty({ message: 'Empresa é obrigatória' })
  empresaId!: string;

  // Status é gerenciado automaticamente
  @IsOptional()
  @IsEnum(StatusContaPagar)
  status?: string;
}
