import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../src/common/encryption/encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const mockEncryptionKey =
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'; // 64 chars hex (valid)

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ENCRYPTION_KEY') {
          return mockEncryptionKey;
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('deve criptografar um texto plain', () => {
      const plainText = '12345678';
      const encrypted = service.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted).toContain(':'); // Formato: iv:encrypted:authTag
    });

    it('deve gerar valores criptografados diferentes para o mesmo texto (devido ao IV aleatório)', () => {
      const plainText = '12345678';
      const encrypted1 = service.encrypt(plainText);
      const encrypted2 = service.encrypt(plainText);

      expect(encrypted1).not.toBe(encrypted2); // IVs diferentes
    });

    it('deve retornar null para valores null ou undefined', () => {
      expect(service.encrypt(null)).toBeNull();
      expect(service.encrypt(undefined)).toBeNull();
      expect(service.encrypt('')).toBeNull();
    });

    it('deve criptografar números', () => {
      const number = 12345;
      const encrypted = service.encrypt(number);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(number.toString());
      expect(encrypted).toContain(':');
    });

    it('deve criptografar texto com caracteres especiais', () => {
      const plainText = 'Conta: 12345-6, Agência: 0001-X';
      const encrypted = service.encrypt(plainText);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
    });
  });

  describe('decrypt', () => {
    it('deve descriptografar um texto criptografado', () => {
      const plainText = '12345678';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('deve descriptografar números', () => {
      const number = '50000.50';
      const encrypted = service.encrypt(number);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(number);
    });

    it('deve retornar null para valores null ou undefined', () => {
      expect(service.decrypt(null)).toBeNull();
      expect(service.decrypt(undefined)).toBeNull();
    });

    it('deve lançar erro para formato inválido', () => {
      expect(() => service.decrypt('invalid_format')).toThrow();
    });

    it('deve preservar caracteres especiais', () => {
      const plainText = 'Agência: 0001-X, Conta: 12345-6';
      const encrypted = service.encrypt(plainText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plainText);
    });
  });

  describe('encryptNumber', () => {
    it('deve criptografar um número', () => {
      const value = 50000.5;
      const encrypted = service.encryptNumber(value);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(value.toString());
      expect(encrypted).toContain(':');
    });

    it('deve retornar null para valores null ou undefined', () => {
      expect(service.encryptNumber(null)).toBeNull();
      expect(service.encryptNumber(undefined)).toBeNull();
    });

    it('deve preservar precisão decimal', () => {
      const value = 123.456789;
      const encrypted = service.encryptNumber(value);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(value);
    });
  });

  describe('decryptNumber', () => {
    it('deve descriptografar e retornar um número', () => {
      const value = 50000.5;
      const encrypted = service.encryptNumber(value);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(value);
    });

    it('deve retornar null para valores null ou undefined', () => {
      expect(service.decryptNumber(null)).toBeNull();
      expect(service.decryptNumber(undefined)).toBeNull();
    });

    it('deve preservar valores decimais negativos', () => {
      const value = -1234.56;
      const encrypted = service.encryptNumber(value);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(value);
    });

    it('deve preservar zero', () => {
      const value = 0;
      const encrypted = service.encryptNumber(value);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(value);
    });
  });

  describe('isEncrypted', () => {
    it('deve validar formato criptografado correto', () => {
      const plainText = '12345678';
      const encrypted = service.encrypt(plainText);

      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('deve retornar false para plain text', () => {
      expect(service.isEncrypted('plain_text')).toBe(false);
    });

    it('deve retornar false para null ou undefined', () => {
      expect(service.isEncrypted(null)).toBe(false);
      expect(service.isEncrypted(undefined)).toBe(false);
    });

    it('deve retornar false para formato inválido', () => {
      expect(service.isEncrypted('abc:def')).toBe(false); // Faltam 3 partes
      expect(service.isEncrypted('abc::def')).toBe(false); // Parte vazia
    });
  });

  describe('mask', () => {
    it('deve mascarar um valor deixando caracteres visíveis no início e fim', () => {
      const value = '12345678';
      const masked = service.mask(value, 2);

      expect(masked).toBe('12****78');
    });

    it('deve retornar **** para valores null ou undefined', () => {
      expect(service.mask(null)).toBe('****');
      expect(service.mask(undefined)).toBe('****');
    });

    it('deve mascarar valores curtos completamente', () => {
      const value = '123';
      const masked = service.mask(value, 2);

      expect(masked).toBe('***'); // Muito curto, mascara com asteriscos
    });

    it('deve respeitar quantidade de caracteres visíveis', () => {
      const value = '1234567890';
      const masked = service.mask(value, 3);

      expect(masked).toBe('123****890');
    });
  });

  describe('generateKey', () => {
    it('deve gerar chave com 64 caracteres hexadecimais', () => {
      const key = EncryptionService.generateKey();

      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/); // Apenas hex lowercase
    });

    it('deve gerar chaves diferentes a cada chamada', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('Segurança e Integridade', () => {
    it('deve detectar tampering - alteração do texto criptografado', () => {
      const plainText = '12345678';
      const encrypted = service.encrypt(plainText);

      // Alterar o primeiro caractere do texto criptografado (garantido que sempre muda)
      const tampered = 'X' + encrypted.substring(1);

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('deve detectar tampering - trocar componentes', () => {
      const plainText = '12345678';
      const encrypted = service.encrypt(plainText);
      const parts = encrypted.split(':');

      // Trocar IV com authTag
      const tampered = `${parts[2]}:${parts[1]}:${parts[0]}`;

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('deve ser determinístico - mesmo plain text descriptografa sempre igual', () => {
      const plainText = 'Conta Bancária 12345-6';
      const encrypted = service.encrypt(plainText);

      // Descriptografar múltiplas vezes
      const decrypted1 = service.decrypt(encrypted);
      const decrypted2 = service.decrypt(encrypted);
      const decrypted3 = service.decrypt(encrypted);

      expect(decrypted1).toBe(plainText);
      expect(decrypted2).toBe(plainText);
      expect(decrypted3).toBe(plainText);
    });
  });

  describe('Casos de Uso Reais', () => {
    it('deve criptografar e descriptografar número de conta bancária', () => {
      const conta = '12345678-9';
      const encrypted = service.encrypt(conta);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(conta);
      expect(encrypted).not.toContain(conta); // Não deve conter plain text
    });

    it('deve criptografar e descriptografar valor monetário', () => {
      const valor = 12345.67;
      const encrypted = service.encryptNumber(valor);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(valor);
    });

    it('deve criptografar e descriptografar valores grandes', () => {
      const valor = 999999999.99;
      const encrypted = service.encryptNumber(valor);
      const decrypted = service.decryptNumber(encrypted);

      expect(decrypted).toBe(valor);
    });

    it('deve criptografar e descriptografar valores com muitas casas decimais', () => {
      const valor = 123.456789012345;
      const encrypted = service.encryptNumber(valor);
      const decrypted = service.decryptNumber(encrypted);

      // Tolerância de precisão de ponto flutuante
      expect(decrypted).toBeCloseTo(valor, 10);
    });
  });
});
