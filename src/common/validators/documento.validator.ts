import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação do primeiro dígito verificador
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  // Validação do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ
 */
export function validarCpfCnpj(documento: string): boolean {
  if (!documento) return false;

  const limpo = documento.replace(/\D/g, '');

  if (limpo.length === 11) {
    return validarCPF(limpo);
  } else if (limpo.length === 14) {
    return validarCNPJ(limpo);
  }

  return false;
}

/**
 * Valida Inscrição Estadual (formato genérico)
 * Aceita: números, letras (para estados que usam) e ISENTO
 */
export function validarIE(ie: string): boolean {
  if (!ie) return true; // IE é opcional

  // Remove espaços
  ie = ie.trim().toUpperCase();

  // Aceita ISENTO ou variações
  if (/^ISENT[OA]?$/i.test(ie)) return true;

  // Remove caracteres não alfanuméricos
  const limpo = ie.replace(/[^A-Z0-9]/g, '');

  // Deve ter entre 8 e 14 caracteres
  if (limpo.length < 8 || limpo.length > 14) return false;

  // Validação básica: deve conter pelo menos alguns dígitos
  if (!/\d/.test(limpo)) return false;

  return true;
}

/**
 * Valida Inscrição Municipal (formato genérico)
 */
export function validarIM(im: string): boolean {
  if (!im) return true; // IM é opcional

  // Remove espaços
  im = im.trim().toUpperCase();

  // Aceita ISENTO ou variações
  if (/^ISENT[OA]?$/i.test(im)) return true;

  // Remove caracteres não alfanuméricos
  const limpo = im.replace(/[^A-Z0-9]/g, '');

  // Deve ter entre 5 e 15 caracteres
  if (limpo.length < 5 || limpo.length > 15) return false;

  // Validação básica: deve conter pelo menos alguns dígitos
  if (!/\d/.test(limpo)) return false;

  return true;
}

/**
 * Decorator para validar CPF/CNPJ
 */
@ValidatorConstraint({ name: 'IsCpfCnpj', async: false })
export class IsCpfCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;
    return validarCpfCnpj(value);
  }

  defaultMessage(): string {
    return 'CPF/CNPJ inválido';
  }
}

export function IsCpfCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfCnpjConstraint,
    });
  };
}

/**
 * Decorator para validar IE
 */
@ValidatorConstraint({ name: 'IsIE', async: false })
export class IsIEConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (value === null || value === undefined) return true; // Opcional
    if (typeof value !== 'string') return false;
    return validarIE(value);
  }

  defaultMessage(): string {
    return 'Inscrição Estadual inválida';
  }
}

export function IsIE(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIEConstraint,
    });
  };
}

/**
 * Decorator para validar IM
 */
@ValidatorConstraint({ name: 'IsIM', async: false })
export class IsIMConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (value === null || value === undefined) return true; // Opcional
    if (typeof value !== 'string') return false;
    return validarIM(value);
  }

  defaultMessage(): string {
    return 'Inscrição Municipal inválida';
  }
}

export function IsIM(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIMConstraint,
    });
  };
}
