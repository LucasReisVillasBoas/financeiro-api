import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { EncryptedStringType } from './transformers/encrypted-string.transformer';
import { EncryptedDecimalType } from './transformers/encrypted-decimal.transformer';

/**
 * Módulo Global de Criptografia
 *
 * @Global - Disponível em toda a aplicação sem necessidade de imports
 *
 * Exporta:
 * - EncryptionService: Serviço de criptografia AES-256-GCM
 *
 * Inicialização:
 * - onModuleInit: Injeta o EncryptionService nos transformers do MikroORM
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule implements OnModuleInit {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    // Inicializa os transformers com o EncryptionService
    // Isso permite que o MikroORM criptografe/descriptografe dados automaticamente
    EncryptedStringType.setEncryptionService(this.encryptionService);
    EncryptedDecimalType.setEncryptionService(this.encryptionService);
  }
}
