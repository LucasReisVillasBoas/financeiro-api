import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador de máscara para código do plano de contas
 * Formato esperado: X.X.XX (ex: 1.1.01, 2.3.15)
 * - Primeiro dígito: nível 1
 * - Segundo dígito após ponto: nível 2
 * - Dois dígitos após segundo ponto: nível 3
 */
@ValidatorConstraint({ name: 'CodigoMask', async: false })
export class CodigoMaskValidator implements ValidatorConstraintInterface {
  validate(codigo: string, args: ValidationArguments): boolean {
    if (!codigo) return false;

    const nivel = (args.object as any).nivel;
    if (!nivel) return true; // Se não houver nível, deixa passar e outra validação cuidará

    // Remove espaços
    const codigoLimpo = codigo.trim();

    // Valida formato básico: apenas números e pontos
    if (!/^[0-9.]+$/.test(codigoLimpo)) {
      return false;
    }

    // Split por ponto
    const partes = codigoLimpo.split('.');

    // Número de partes deve corresponder ao nível
    if (partes.length !== nivel) {
      return false;
    }

    // Valida cada parte
    for (let i = 0; i < partes.length; i++) {
      const parte = partes[i];

      // Cada parte deve ter pelo menos 1 dígito
      if (parte.length === 0 || !/^[0-9]+$/.test(parte)) {
        return false;
      }

      // Validações específicas por nível (opcional, pode ser customizado)
      if (i === 0 && parte.length > 2) {
        // Nível 1: máximo 2 dígitos
        return false;
      }
      if (i === 1 && parte.length > 2) {
        // Nível 2: máximo 2 dígitos
        return false;
      }
      if (i === 2 && parte.length > 2) {
        // Nível 3: máximo 2 dígitos
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const nivel = (args.object as any).nivel;
    return `Código deve estar no formato compatível com nível ${nivel} (ex: nível 1: "1", nível 2: "1.1", nível 3: "1.1.01")`;
  }
}

/**
 * Valida se o código é compatível com o código do pai
 * Ex: Se pai é "1.1", o filho deve começar com "1.1."
 */
export function validarCodigoCompatibilidadeComPai(
  codigoConta: string,
  codigoPai?: string,
): boolean {
  if (!codigoPai) return true; // Se não tem pai, não precisa validar

  // Remove espaços
  const codigo = codigoConta.trim();
  const pai = codigoPai.trim();

  // O código da conta deve começar com o código do pai seguido de ponto
  return codigo.startsWith(pai + '.');
}

/**
 * Valida hierarquia completa do código
 */
export function validarHierarquiaCodigo(
  codigo: string,
  nivel: number,
  codigoPai?: string,
): { valido: boolean; mensagem?: string } {
  const codigoLimpo = codigo.trim();
  const partes = codigoLimpo.split('.');

  // Valida número de partes
  if (partes.length !== nivel) {
    return {
      valido: false,
      mensagem: `Código deve ter ${nivel} níveis (partes separadas por ponto)`,
    };
  }

  // Se tem pai, valida compatibilidade
  if (codigoPai && !validarCodigoCompatibilidadeComPai(codigoLimpo, codigoPai)) {
    return {
      valido: false,
      mensagem: `Código deve começar com "${codigoPai}." para ser filho desta conta`,
    };
  }

  return { valido: true };
}
