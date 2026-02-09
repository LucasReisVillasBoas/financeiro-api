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

function sanitizeContato(contato: any): any {
  if (!contato) return contato;

  return {
    id: contato.id,
    nome: contato.nome,
    funcao: contato.funcao,
    email: maskEmail(contato.email),
    telefone: maskPhone(contato.telefone),
    celular: maskPhone(contato.celular),
    criadoEm: contato.criadoEm,
    atualizadoEm: contato.atualizadoEm,
  };
}

export function sanitizeEmpresaResponse(empresa: Empresa): any {
  if (!empresa) return empresa;

  const { email, telefone, celular, sede, contatos, ...rest } = empresa as any;

  const result: any = {
    ...rest,
    sede: sede ? sede.id : null,
    email: maskEmail(email),
    telefone: maskPhone(telefone),
    celular: maskPhone(celular),
  };

  // Inclui contatos se existirem (Collection do MikroORM)
  if (contatos) {
    const contatosArray = contatos.isInitialized?.()
      ? contatos.getItems()
      : Array.isArray(contatos)
        ? contatos
        : [];

    if (contatosArray.length > 0) {
      result.contatos = contatosArray
        .filter((c: any) => !c.deletadoEm)
        .map(sanitizeContato);
    }
  }

  return result;
}

export function sanitizeEmpresasResponse(empresas: Empresa[]): any[] {
  if (!Array.isArray(empresas)) return empresas;

  return empresas.map(sanitizeEmpresaResponse);
}
