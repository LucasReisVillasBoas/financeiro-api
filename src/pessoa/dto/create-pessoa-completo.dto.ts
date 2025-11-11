import { IsString, IsOptional, IsUUID, IsBoolean, IsDateString, MaxLength, MinLength, IsEnum, IsArray, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoPessoa as TipoPessoaEnum, TipoContribuinte, SituacaoFinanceira } from '../../entities/pessoa/tipo-pessoa.enum';
import { IsCpfCnpj, IsIE, IsIM } from '../../common/validators/documento.validator';

export enum TipoPessoa {
  FISICA = 'Física',
  JURIDICA = 'Jurídica',
}

export class CreatePessoaCompletoDto {
  @ApiProperty({ description: 'ID do cliente (empresa)' })
  @IsUUID('4', { message: 'Cliente ID deve ser um UUID válido' })
  clienteId!: string;

  @ApiProperty({ description: 'Tipo de pessoa', enum: TipoPessoa })
  @IsEnum(TipoPessoa, { message: 'Tipo deve ser Física ou Jurídica' })
  tipo!: TipoPessoa;

  @ApiProperty({ description: 'Nome completo ou razão social' })
  @IsString({ message: 'Nome deve ser um texto' })
  @MaxLength(60, { message: 'Nome deve ter no máximo 60 caracteres' })
  nome!: string;

  @ApiProperty({ description: 'CPF ou CNPJ' })
  @IsString({ message: 'CPF/CNPJ deve ser um texto' })
  cpf_cnpj!: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Telefone fixo', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ description: 'Celular', required: false })
  @IsOptional()
  @IsString()
  celular?: string;

  @ApiProperty({ description: 'CEP' })
  @IsString({ message: 'CEP deve ser um texto' })
  cep!: string;

  @ApiProperty({ description: 'Logradouro' })
  @IsString({ message: 'Logradouro deve ser um texto' })
  logradouro!: string;

  @ApiProperty({ description: 'Número' })
  @IsString({ message: 'Número deve ser um texto' })
  numero!: string;

  @ApiProperty({ description: 'Complemento', required: false })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiProperty({ description: 'Bairro' })
  @IsString({ message: 'Bairro deve ser um texto' })
  bairro!: string;

  @ApiProperty({ description: 'Cidade' })
  @IsString({ message: 'Cidade deve ser um texto' })
  cidade!: string;

  @ApiProperty({ description: 'UF (estado)' })
  @IsString({ message: 'UF deve ser um texto' })
  @MaxLength(2, { message: 'UF deve ter 2 caracteres' })
  uf!: string;

  @ApiProperty({ description: 'Código IBGE da cidade', required: false })
  @IsOptional()
  @IsString()
  codigoIbge?: string;

  @ApiProperty({ description: 'Pessoa ativa ou inativa', default: true })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;

  @ApiProperty({ description: 'Observações', required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  // Campos fiscais
  @ApiProperty({ description: 'Inscrição Estadual ou RG', required: false })
  @IsOptional()
  @IsIE()
  ieRg?: string;

  @ApiProperty({ description: 'Inscrição Municipal', required: false })
  @IsOptional()
  @IsIM()
  im?: string;

  @ApiProperty({ enum: TipoContribuinte, description: 'Tipo de contribuinte (SEFAZ)', required: false })
  @IsOptional()
  @IsEnum(TipoContribuinte)
  tipoContribuinte?: TipoContribuinte;

  @ApiProperty({ description: 'Consumidor final', default: true })
  @IsOptional()
  @IsBoolean()
  consumidorFinal?: boolean;

  // Campos financeiros
  @ApiProperty({ description: 'Limite de crédito (R$)', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  limiteCredito?: number;

  @ApiProperty({ enum: SituacaoFinanceira, description: 'Situação financeira', required: false })
  @IsOptional()
  @IsEnum(SituacaoFinanceira)
  situacaoFinanceira?: SituacaoFinanceira;

  @ApiProperty({ description: 'Data de aniversário', required: false })
  @IsOptional()
  @IsDateString()
  aniversario?: string;

  // Tipos de pessoa
  @ApiProperty({ description: 'Tipos de pessoa', enum: TipoPessoaEnum, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(TipoPessoaEnum, { each: true })
  tipos!: TipoPessoaEnum[];

  // Multi-tenancy
  @ApiProperty({ description: 'ID da filial', required: false })
  @IsOptional()
  @IsUUID('4')
  filialId?: string;
}
