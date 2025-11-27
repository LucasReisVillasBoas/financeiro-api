import { Type } from '@mikro-orm/core';
import { EncryptionService } from '../encryption.service';

/**
 * Transformer do MikroORM para Campos String Criptografados
 *
 * Uso nas entidades:
 * @Property({ type: EncryptedStringType })
 * conta: string;
 *
 * Funcionamento:
 * - SAVE: Criptografa automaticamente antes de salvar no banco
 * - LOAD: Descriptografa automaticamente ao carregar do banco
 * - Banco de dados armazena: "iv:encrypted:authTag" (base64)
 * - Aplicação trabalha com: valor original em plain text
 */
export class EncryptedStringType extends Type<string | null, string | null> {
  private static encryptionService: EncryptionService;

  /**
   * Injeta o EncryptionService (chamado pelo módulo)
   */
  static setEncryptionService(service: EncryptionService) {
    EncryptedStringType.encryptionService = service;
  }

  /**
   * Converte valor da aplicação para o banco (criptografa)
   */
  convertToDatabaseValue(value: string | null | undefined): string | null {
    if (!EncryptedStringType.encryptionService) {
      throw new Error('EncryptionService não foi inicializado');
    }

    if (value === null || value === undefined || value === '') {
      return null;
    }

    return EncryptedStringType.encryptionService.encrypt(value);
  }

  /**
   * Converte valor do banco para a aplicação (descriptografa)
   */
  convertToJSValue(value: string | null | undefined): string | null {
    if (!EncryptedStringType.encryptionService) {
      throw new Error('EncryptionService não foi inicializado');
    }

    if (!value) {
      return null;
    }

    // Se o valor já está criptografado, descriptografa
    // Caso contrário, retorna como está (suporte a migração gradual)
    if (EncryptedStringType.encryptionService.isEncrypted(value)) {
      return EncryptedStringType.encryptionService.decrypt(value);
    }

    return value;
  }

  /**
   * Define o tipo no banco de dados (TEXT para armazenar dados criptografados)
   */
  getColumnType(): string {
    return 'text';
  }
}
