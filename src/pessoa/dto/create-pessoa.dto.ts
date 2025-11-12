import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsEnum,
  IsArray,
  ArrayMinSize,
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

export class CreatePessoaDto {
  @ApiProperty({
    description: 'ID do cliente (multi-tenancy)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cliente ID deve ser um texto' })
  @MaxLength(255, { message: 'Cliente ID deve ter no máximo 255 caracteres' })
  clienteId?: string;

  @ApiProperty({ description: 'ID da empresa' })
  @IsUUID('4', { message: 'Empresa ID deve ser um UUID válido' })
  empresaId!: string;

  @ApiProperty({
    description: 'ID da filial (opcional para multi-tenancy)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Filial ID deve ser um UUID válido' })
  filialId?: string;

  @ApiProperty({ description: 'ID do endereço' })
  @IsUUID('4', { message: 'Endereço ID deve ser um UUID válido' })
  enderecoId!: string;

  @ApiProperty({
    description:
      'Tipos da pessoa (cliente, fornecedor, funcionário, transportadora, médico, convênio, hospital)',
    enum: TipoPessoa,
    isArray: true,
    example: [TipoPessoa.CLIENTE, TipoPessoa.FORNECEDOR],
  })
  @IsArray({ message: 'Tipos deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos um tipo de pessoa' })
  @IsEnum(TipoPessoa, { each: true, message: 'Tipo de pessoa inválido' })
  tipos!: TipoPessoa[];

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
    example: '12345678901',
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser um texto' })
  @IsCpfCnpj({ message: 'CPF ou CNPJ inválido' })
  documento?: string;

  @ApiProperty({
    description: 'Inscrição Estadual ou RG',
    required: false,
    example: '123456789',
  })
  @IsOptional()
  @IsString({ message: 'IE/RG deve ser um texto' })
  @IsIE({ message: 'Inscrição Estadual inválida' })
  @MaxLength(14, { message: 'IE/RG deve ter no máximo 14 caracteres' })
  ieRg?: string;

  @ApiProperty({
    description: 'Inscrição Municipal',
    required: false,
    example: '12345',
  })
  @IsOptional()
  @IsString({ message: 'IM deve ser um texto' })
  @IsIM({ message: 'Inscrição Municipal inválida' })
  @MaxLength(20, { message: 'IM deve ter no máximo 20 caracteres' })
  im?: string;

  @ApiProperty({
    description: 'Tipo de contribuinte conforme tabela SEFAZ',
    enum: TipoContribuinte,
    required: false,
    example: TipoContribuinte.CONTRIBUINTE_ICMS,
  })
  @IsOptional()
  @IsEnum(TipoContribuinte, {
    message:
      'Tipo de contribuinte inválido. Use: 1 (Contribuinte ICMS), 2 (Isento) ou 9 (Não Contribuinte)',
  })
  tipoContribuinte?: TipoContribuinte;

  @ApiProperty({
    description: 'Indica se a pessoa é consumidor final',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Consumidor final deve ser verdadeiro ou falso' })
  consumidorFinal?: boolean;

  @ApiProperty({
    description: 'Data de aniversário (formato ISO: YYYY-MM-DD)',
    required: false,
    example: '1990-01-15',
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
    example: 5000.0,
    default: 0,
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
    description:
      'Situação financeira da pessoa (ativo, inativo, bloqueado, suspenso)',
    enum: SituacaoFinanceira,
    default: SituacaoFinanceira.ATIVO,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoFinanceira, {
    message:
      'Situação financeira deve ser ativo, inativo, bloqueado ou suspenso',
  })
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
    default: SituacaoPessoa.ATIVO,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoPessoa, {
    message: 'Situação deve ser ativo, inativo, bloqueado ou pendente',
  })
  situacao?: SituacaoPessoa;

  @ApiProperty({ description: 'Pessoa ativa ou inativa', default: true })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
