import { validarCPF, validarCNPJ, validarCpfCnpj, validarIE, validarIM } from '../../src/common/validators/documento.validator';

describe('Validadores de Documento', () => {
  describe('validarCPF', () => {
    it('deve validar CPF válido', () => {
      expect(validarCPF('12345678909')).toBe(true);
      expect(validarCPF('111.444.777-35')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validarCPF('12345678901')).toBe(false);
      expect(validarCPF('11111111111')).toBe(false);
      expect(validarCPF('123')).toBe(false);
    });
  });

  describe('validarCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      expect(validarCNPJ('11222333000181')).toBe(true);
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validarCNPJ('11222333000180')).toBe(false);
      expect(validarCNPJ('11111111111111')).toBe(false);
      expect(validarCNPJ('123')).toBe(false);
    });
  });

  describe('validarCpfCnpj', () => {
    it('deve validar CPF ou CNPJ válidos', () => {
      expect(validarCpfCnpj('12345678909')).toBe(true);
      expect(validarCpfCnpj('11222333000181')).toBe(true);
    });

    it('deve rejeitar documentos inválidos', () => {
      expect(validarCpfCnpj('12345678901')).toBe(false);
      expect(validarCpfCnpj('11222333000180')).toBe(false);
      expect(validarCpfCnpj('123')).toBe(false);
      expect(validarCpfCnpj('')).toBe(false);
    });
  });

  describe('validarIE', () => {
    it('deve aceitar IE válida (formato genérico)', () => {
      expect(validarIE('123456789')).toBe(true);
      expect(validarIE('12.345.678-9')).toBe(true);
      expect(validarIE('ISENTO')).toBe(true);
      expect(validarIE('Isenta')).toBe(true);
    });

    it('deve rejeitar IE inválida', () => {
      expect(validarIE('123')).toBe(false); // Muito curto
      expect(validarIE('123456789012345')).toBe(false); // Muito longo
      expect(validarIE('ABCDEFGH')).toBe(false); // Sem dígitos
    });

    it('deve aceitar IE vazia (opcional)', () => {
      expect(validarIE('')).toBe(true);
      expect(validarIE(undefined as any)).toBe(true);
      expect(validarIE(null as any)).toBe(true);
    });
  });

  describe('validarIM', () => {
    it('deve aceitar IM válida (formato genérico)', () => {
      expect(validarIM('12345')).toBe(true);
      expect(validarIM('123456789012345')).toBe(true);
      expect(validarIM('ISENTO')).toBe(true);
    });

    it('deve rejeitar IM inválida', () => {
      expect(validarIM('123')).toBe(false); // Muito curto
      expect(validarIM('1234567890123456')).toBe(false); // Muito longo
      expect(validarIM('ABCDEF')).toBe(false); // Sem dígitos
    });

    it('deve aceitar IM vazia (opcional)', () => {
      expect(validarIM('')).toBe(true);
      expect(validarIM(undefined as any)).toBe(true);
      expect(validarIM(null as any)).toBe(true);
    });
  });
});
