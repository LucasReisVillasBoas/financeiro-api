import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Serviço de Criptografia para Dados Sensíveis
 *
 * Implementa criptografia AES-256-GCM (Galois/Counter Mode)
 * - Autenticação: Garante integridade dos dados
 * - Confidencialidade: Dados não podem ser lidos sem a chave
 * - Segurança: Padrão aprovado pelo NIST para dados Top Secret
 *
 * Uso:
 * - Dados bancários (conta, agência)
 * - Valores financeiros (saldos, movimentações)
 * - Documentos sensíveis
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16; // 128 bits para GCM
  private readonly authTagLength = 16; // 128 bits de autenticação

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      this.logger.error(
        '❌ ENCRYPTION_KEY não configurada! Dados sensíveis não podem ser criptografados.',
      );
      throw new Error(
        'ENCRYPTION_KEY é obrigatória. Configure no .env: openssl rand -hex 32',
      );
    }

    // Validar tamanho da chave (deve ter 64 caracteres hex = 32 bytes)
    if (encryptionKey.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes)',
      );
    }

    // Converter chave hex para Buffer
    this.key = Buffer.from(encryptionKey, 'hex');

    this.logger.log('✅ EncryptionService inicializado com AES-256-GCM');
  }

  /**
   * Criptografa um valor usando AES-256-GCM
   *
   * @param plainText - Texto ou número a ser criptografado
   * @returns String no formato: iv:encryptedData:authTag (base64)
   *
   * @example
   * const encrypted = encryptionService.encrypt('12345678-9');
   * // Retorna: "a1b2c3d4e5f6....:encrypted_base64....:auth_tag_base64...."
   */
  encrypt(plainText: string | number | null | undefined): string | null {
    if (plainText === null || plainText === undefined || plainText === '') {
      return null;
    }

    try {
      // Converter para string se for número
      const textToEncrypt = String(plainText);

      // Gerar IV aleatório (Initialization Vector)
      const iv = crypto.randomBytes(this.ivLength);

      // Criar cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Criptografar
      let encrypted = cipher.update(textToEncrypt, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Obter authentication tag
      const authTag = cipher.getAuthTag();

      // Retornar no formato: iv:encrypted:authTag (tudo em base64)
      return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;
    } catch (error) {
      this.logger.error('❌ Erro ao criptografar dados:', error);
      throw new Error('Falha na criptografia de dados sensíveis');
    }
  }

  /**
   * Descriptografa um valor criptografado com AES-256-GCM
   *
   * @param encryptedText - String no formato: iv:encryptedData:authTag
   * @returns Texto descriptografado original
   *
   * @example
   * const decrypted = encryptionService.decrypt('a1b2c3d4....:encrypted....:tag....');
   * // Retorna: "12345678-9"
   */
  decrypt(encryptedText: string | null | undefined): string | null {
    if (!encryptedText) {
      return null;
    }

    try {
      // Separar componentes: iv:encrypted:authTag
      const parts = encryptedText.split(':');

      if (parts.length !== 3) {
        throw new Error('Formato de dado criptografado inválido');
      }

      const [ivBase64, encryptedData, authTagBase64] = parts;

      // Converter de base64 para Buffer
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Criar decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Descriptografar
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('❌ Erro ao descriptografar dados:', error);
      throw new Error('Falha na descriptografia - dados corrompidos ou chave inválida');
    }
  }

  /**
   * Criptografa um valor numérico (para campos decimal/numeric)
   *
   * @param value - Número a ser criptografado
   * @returns String criptografada ou null
   */
  encryptNumber(value: number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return this.encrypt(value.toString());
  }

  /**
   * Descriptografa e retorna um número
   *
   * @param encryptedValue - String criptografada
   * @returns Número descriptografado ou null
   */
  decryptNumber(encryptedValue: string | null | undefined): number | null {
    if (!encryptedValue) {
      return null;
    }

    const decrypted = this.decrypt(encryptedValue);
    return decrypted ? parseFloat(decrypted) : null;
  }

  /**
   * Gera uma nova chave de criptografia
   * (Uso apenas para setup inicial ou rotação de chaves)
   *
   * @returns Chave hexadecimal de 64 caracteres
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valida se um texto está no formato criptografado correto
   *
   * @param text - Texto a validar
   * @returns true se estiver no formato correto
   */
  isEncrypted(text: string | null | undefined): boolean {
    if (!text) return false;

    const parts = text.split(':');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Mascara um valor para exibição em logs (não revela o valor real)
   *
   * @param value - Valor a mascarar
   * @param visibleChars - Quantidade de caracteres visíveis no início e fim
   * @returns Valor mascarado
   *
   * @example
   * mask('12345678', 2) // Retorna: "12****78"
   */
  mask(value: string | null | undefined, visibleChars = 2): string {
    if (!value) return '****';

    if (value.length <= visibleChars * 2) {
      return '*'.repeat(value.length);
    }

    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    const middle = '*'.repeat(value.length - visibleChars * 2);

    return `${start}${middle}${end}`;
  }
}
