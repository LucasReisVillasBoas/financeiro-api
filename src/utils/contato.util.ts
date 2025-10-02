import type { Contato } from '../entities/contato/contato.entity';

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

export function sanitizeContatoResponse(contato: Contato): any {
  if (!contato) return contato;

  const { cliente, filial, email, telefone, celular, ...rest } = contato;

  return {
    ...rest,
    clienteId: cliente?.id,
    filialId: filial?.id,
    email: maskEmail(email),
    telefone: maskPhone(telefone),
    celular: maskPhone(celular),
  };
}

export function sanitizeContatosResponse(contatos: Contato[]): any[] {
  if (!Array.isArray(contatos)) return contatos;

  return contatos.map(sanitizeContatoResponse);
}
