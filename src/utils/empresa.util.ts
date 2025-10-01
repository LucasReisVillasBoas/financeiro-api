import type { Empresa } from '../entities/empresa/empresa.entity';

export const normalizeCnpjCpf = (value: string) => {
  return value ? value.replace(/\D/g, '') : '';
};

export const isValidCnpjCpf = (value: string): boolean => {
  const normalized = normalizeCnpjCpf(value);
  return normalized.length === 11 || normalized.length === 14;
};

function maskEmail(email?: string): string | undefined {
  if (!email) return email;

  const atIndex = email.indexOf('@');
  if (atIndex <= 3) return email;

  const firstThree = email.substring(0, 3);
  const domain = email.substring(atIndex);
  const maskedPart = '*'.repeat(atIndex - 3);

  return `${firstThree}${maskedPart}${domain}`;
}

function maskPhone(phone?: string): string | undefined {
  if (!phone) return phone;
  if (phone.length <= 4) return phone;

  const lastFour = phone.slice(-4);
  const maskedPart = '*'.repeat(phone.length - 4);

  return `${maskedPart}${lastFour}`;
}

export function sanitizeEmpresaResponse(empresa: Empresa): any {
  if (!empresa) return empresa;

  const { email, telefone, celular, ...rest } = empresa;

  return {
    ...rest,
    email: maskEmail(email),
    telefone: maskPhone(telefone),
    celular: maskPhone(celular),
  };
}

export function sanitizeEmpresasResponse(empresas: Empresa[]): any[] {
  if (!Array.isArray(empresas)) return empresas;

  return empresas.map(sanitizeEmpresaResponse);
}
