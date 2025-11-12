import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TipoPessoa,
  SituacaoPessoa,
  TipoContribuinte,
  SituacaoFinanceira,
} from '../../entities/pessoa/tipo-pessoa.enum';
import {
  IsCpfCnpj,
  IsIE,
  IsIM,
} from '../../common/validators/documento.validator';

export class UpdatePessoaDto {
  @ApiProperty({
    description: 'ID do cliente (multi-tenancy)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cliente ID deve ser um texto' })
  @MaxLength(255, { message: 'Cliente ID deve ter no máximo 255 caracteres' })
  clienteId?: string;

  @ApiProperty({ description: 'ID da empresa', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'Empresa ID deve ser um UUID válido' })
  empresaId?: string;

  @ApiProperty({
    description: 'ID da filial (opcional para multi-tenancy)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Filial ID deve ser um UUID válido' })
  filialId?: string;

  @ApiProperty({ description: 'ID do endereço', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'Endereço ID deve ser um UUID válido' })
  enderecoId?: string;

  @ApiProperty({
    description:
      'Tipos da pessoa (cliente, fornecedor, funcionário, transportadora, médico, convênio, hospital)',
    enum: TipoPessoa,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Tipos deve ser um array' })
  @IsEnum(TipoPessoa, { each: true, message: 'Tipo de pessoa inválido' })
  tipos?: TipoPessoa[];

  @ApiProperty({
    description: 'Razão social ou nome completo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Razão/Nome deve ser um texto' })
  @MaxLength(60, { message: 'Razão/Nome deve ter no máximo 60 caracteres' })
  razaoNome?: string;

  @ApiProperty({ description: 'Nome fantasia ou apelido', required: false })
  @IsOptional()
  @IsString({ message: 'Fantasia/Apelido deve ser um texto' })
  @MaxLength(60, {
    message: 'Fantasia/Apelido deve ter no máximo 60 caracteres',
  })
  fantasiaApelido?: string;

  @ApiProperty({
    description: 'CPF ou CNPJ (apenas números ou com formatação)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser um texto' })
  @IsCpfCnpj({ message: 'CPF ou CNPJ inválido' })
  documento?: string;

  @ApiProperty({ description: 'Inscrição Estadual ou RG', required: false })
  @IsOptional()
  @IsString({ message: 'IE/RG deve ser um texto' })
  @IsIE({ message: 'Inscrição Estadual inválida' })
  @MaxLength(14, { message: 'IE/RG deve ter no máximo 14 caracteres' })
  ieRg?: string;

  @ApiProperty({ description: 'Inscrição Municipal', required: false })
  @IsOptional()
  @IsString({ message: 'IM deve ser um texto' })
  @IsIM({ message: 'Inscrição Municipal inválida' })
  @MaxLength(20, { message: 'IM deve ter no máximo 20 caracteres' })
  im?: string;

  @ApiProperty({
    description: 'Tipo de contribuinte conforme tabela SEFAZ',
    enum: TipoContribuinte,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoContribuinte, { message: 'Tipo de contribuinte inválido' })
  tipoContribuinte?: TipoContribuinte;

  @ApiProperty({
    description: 'Indica se a pessoa é consumidor final',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Consumidor final deve ser verdadeiro ou falso' })
  consumidorFinal?: boolean;

  @ApiProperty({
    description: 'Data de aniversário (formato ISO: YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Aniversário deve ser uma data válida no formato ISO (YYYY-MM-DD)',
    },
  )
  aniversario?: string;

  @ApiProperty({
    description: 'Limite de crédito disponível (em reais)',
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Limite de crédito deve ser um número com no máximo 2 casas decimais',
    },
  )
  @Min(0, { message: 'Limite de crédito não pode ser negativo' })
  limiteCredito?: number;

  @ApiProperty({
    description: 'Situação financeira da pessoa',
    enum: SituacaoFinanceira,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoFinanceira, { message: 'Situação financeira inválida' })
  situacaoFinanceira?: SituacaoFinanceira;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsString({ message: 'Email deve ser um texto' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  email?: string;

  @ApiProperty({ description: 'Telefone', required: false })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser um texto' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  telefone?: string;

  @ApiProperty({
    description: 'Situação da pessoa (ativo, inativo, bloqueado, pendente)',
    enum: SituacaoPessoa,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoPessoa, {
    message: 'Situação deve ser ativo, inativo, bloqueado ou pendente',
  })
  situacao?: SituacaoPessoa;

  @ApiProperty({ description: 'Pessoa ativa ou inativa', required: false })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;

  // Campos de endereço
  @ApiProperty({ description: 'CEP', required: false })
  @IsOptional()
  @IsString({ message: 'CEP deve ser um texto' })
  @MaxLength(8, { message: 'CEP deve ter no máximo 8 caracteres' })
  cep?: string;

  @ApiProperty({ description: 'Logradouro', required: false })
  @IsOptional()
  @IsString({ message: 'Logradouro deve ser um texto' })
  @MaxLength(100, { message: 'Logradouro deve ter no máximo 100 caracteres' })
  logradouro?: string;

  @ApiProperty({ description: 'Número', required: false })
  @IsOptional()
  @IsString({ message: 'Número deve ser um texto' })
  @MaxLength(10, { message: 'Número deve ter no máximo 10 caracteres' })
  numero?: string;

  @ApiProperty({ description: 'Complemento', required: false })
  @IsOptional()
  @IsString({ message: 'Complemento deve ser um texto' })
  @MaxLength(50, { message: 'Complemento deve ter no máximo 50 caracteres' })
  complemento?: string;

  @ApiProperty({ description: 'Bairro', required: false })
  @IsOptional()
  @IsString({ message: 'Bairro deve ser um texto' })
  @MaxLength(50, { message: 'Bairro deve ter no máximo 50 caracteres' })
  bairro?: string;

  @ApiProperty({ description: 'Cidade', required: false })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser um texto' })
  @MaxLength(60, { message: 'Cidade deve ter no máximo 60 caracteres' })
  cidade?: string;

  @ApiProperty({ description: 'UF', required: false })
  @IsOptional()
  @IsString({ message: 'UF deve ser um texto' })
  @MaxLength(2, { message: 'UF deve ter 2 caracteres' })
  uf?: string;

  @ApiProperty({ description: 'Código IBGE', required: false })
  @IsOptional()
  @IsString({ message: 'Código IBGE deve ser um texto' })
  codigoIbge?: string;
}
