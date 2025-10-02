import type { Usuario } from '../entities/usuario/usuario.entity';

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

export function sanitizeUserResponse(user: Usuario): any {
  if (!user) return user;

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    senha,
    email,
    telefone,
    empresasFiliais,
    cidade,
    usuarioContatos,
    ...rest
  } = user;

  return {
    ...rest,
    email: maskEmail(email),
    telefone: maskPhone(telefone),
    empresasFiliais: empresasFiliais.isInitialized()
      ? empresasFiliais.getItems().map((ef) => ({ id: ef.id }))
      : [],
    cidade: cidade?.id,
    usuarioContatos: usuarioContatos.isInitialized()
      ? usuarioContatos.getItems().map((uc) => ({ id: uc.contato.id }))
      : [],
  };
}

export function sanitizeUsersResponse(users: Usuario[]): any[] {
  if (!Array.isArray(users)) return users;

  return users.map(sanitizeUserResponse);
}
