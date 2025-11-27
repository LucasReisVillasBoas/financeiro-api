import { Type } from '@mikro-orm/core';
import { EncryptionService } from '../encryption.service';

/**
 * Transformer do MikroORM para Campos Numéricos Criptografados
 *
 * Uso nas entidades:
 * @Property({ type: EncryptedDecimalType })
 * saldo: number;
 *
 * Funcionamento:
 * - SAVE: Criptografa número como string antes de salvar
 * - LOAD: Descriptografa e converte de volta para número
 * - Banco de dados armazena: "iv:encrypted:authTag" (base64)
 * - Aplicação trabalha com: number
 * - Preserva precisão decimal (não há perda de precisão)
 */
export class EncryptedDecimalType extends Type<number | null, string | null> {
  private static encryptionService: EncryptionService;

  /**
   * Injeta o EncryptionService (chamado pelo módulo)
   */
  static setEncryptionService(service: EncryptionService) {
    EncryptedDecimalType.encryptionService = service;
  }

  /**
   * Converte valor da aplicação (number) para o banco (string criptografada)
   */
  convertToDatabaseValue(value: number | null | undefined): string | null {
    if (!EncryptedDecimalType.encryptionService) {
      throw new Error('EncryptionService não foi inicializado');
    }

    if (value === null || value === undefined) {
      return null;
    }

    // Criptografa o número como string para preservar precisão
    return EncryptedDecimalType.encryptionService.encryptNumber(value);
  }

  /**
   * Converte valor do banco (string criptografada) para a aplicação (number)
   */
  convertToJSValue(value: string | null | undefined): number | null {
    if (!EncryptedDecimalType.encryptionService) {
      throw new Error('EncryptionService não foi inicializado');
    }

    if (!value) {
      return null;
    }

    // Se o valor já está criptografado, descriptografa
    // Caso contrário, converte diretamente (suporte a migração gradual)
    if (
      typeof value === 'string' &&
      EncryptedDecimalType.encryptionService.isEncrypted(value)
    ) {
      return EncryptedDecimalType.encryptionService.decryptNumber(value);
    }

    // Valor não criptografado - converte diretamente para number
    return typeof value === 'number' ? value : parseFloat(value as string);
  }

  /**
   * Define o tipo no banco de dados (TEXT para armazenar dados criptografados)
   */
  getColumnType(): string {
    return 'text';
  }

  /**
   * Compara dois valores criptografados
   * Nota: Para comparação, precisamos descriptografar ambos
   */
  compareAsType(): string {
    return 'number';
  }
}
