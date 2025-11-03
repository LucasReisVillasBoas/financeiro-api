import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO para linha de importação de CSV/XLS
 */
export class ImportPlanoContasRowDto {
  codigo: string;
  descricao: string;
  tipo: string;
  codigoPai?: string;
  permite_lancamento?: string | boolean;
  ativo?: string | boolean;
}

/**
 * DTO para requisição de importação
 */
export class ImportPlanoContasDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Empresa ID é obrigatório' })
  empresaId!: string;

  @IsOptional()
  @IsBoolean()
  sobrescrever?: boolean = false; // Flag para confirmar sobrescrita de contas existentes

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false; // Apenas validar, não importar de fato

  linhas!: ImportPlanoContasRowDto[];
}

/**
 * Resultado da validação de uma linha
 */
export interface ImportValidationResult {
  linha: number;
  codigo: string;
  valido: boolean;
  erros: string[];
  avisos: string[];
  contaExistente?: boolean;
  contaEmUso?: boolean;
}

/**
 * Resultado da importação
 */
export interface ImportResult {
  sucesso: boolean;
  totalLinhas: number;
  importadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: ImportValidationResult[];
  avisos: ImportValidationResult[];
  mensagem: string;
}
