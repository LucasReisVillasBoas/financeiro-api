import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidIBGE', async: false })
export class IsValidIBGEConstraint implements ValidatorConstraintInterface {
  validate(codigoIbge: string, args: ValidationArguments) {
    if (!codigoIbge || typeof codigoIbge !== 'string') {
      return false;
    }

    // Verifica se tem exatamente 7 dígitos
    if (!/^[0-9]{7}$/.test(codigoIbge)) {
      return false;
    }

    // Validação do dígito verificador do código IBGE
    const codigo = codigoIbge.substring(0, 6);
    const digitoVerificador = parseInt(codigoIbge.substring(6, 7));

    // Calcula o dígito verificador
    let soma = 0;
    const pesos = [1, 2, 1, 2, 1, 2];

    for (let i = 0; i < 6; i++) {
      let resultado = parseInt(codigo[i]) * pesos[i];
      if (resultado > 9) {
        resultado = Math.floor(resultado / 10) + (resultado % 10);
      }
      soma += resultado;
    }

    const digitoCalculado = ((Math.ceil(soma / 10) * 10) - soma) % 10;

    return digitoVerificador === digitoCalculado;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Código IBGE inválido. O código deve ter 7 dígitos numéricos com dígito verificador válido';
  }
}

export function IsValidIBGE(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIBGEConstraint,
    });
  };
}

// Lista parcial de códigos IBGE válidos por UF (opcional - pode ser expandida)
// Fonte: IBGE - Instituto Brasileiro de Geografia e Estatística
export const CODIGOS_IBGE_VALIDOS: Record<string, string[]> = {
  // São Paulo - Principais cidades
  'SP': [
    '3550308', // São Paulo
    '3509502', // Campinas
    '3518800', // Guarulhos
    '3547809', // Santo André
    '3543402', // Ribeirão Preto
    '3548708', // São Bernardo do Campo
    '3552205', // Sorocaba
    '3534401', // Osasco
    '3549904', // São José dos Campos
    '3549805', // São José do Rio Preto
  ],
  // Rio de Janeiro - Principais cidades
  'RJ': [
    '3304557', // Rio de Janeiro
    '3301702', // Duque de Caxias
    '3304904', // São Gonçalo
    '3303500', // Nova Iguaçu
    '3303302', // Niterói
    '3300456', // Belford Roxo
    '3304144', // São João de Meriti
    '3301009', // Campos dos Goytacazes
    '3303906', // Petrópolis
    '3305109', // Volta Redonda
  ],
  // Minas Gerais - Principais cidades
  'MG': [
    '3106200', // Belo Horizonte
    '3170206', // Uberlândia
    '3118601', // Contagem
    '3136702', // Juiz de Fora
    '3106705', // Betim
    '3143302', // Montes Claros
    '3154606', // Ribeirão das Neves
    '3170107', // Uberaba
    '3127701', // Governador Valadares
    '3131307', // Ipatinga
  ],
  // Adicione mais estados conforme necessário
};

export function isKnownIBGECode(codigoIbge: string, uf?: string): boolean {
  if (!uf) {
    for (const codes of Object.values(CODIGOS_IBGE_VALIDOS)) {
      if (codes.includes(codigoIbge)) {
        return true;
      }
    }
    return false;
  }

  const codesForUF = CODIGOS_IBGE_VALIDOS[uf];
  return codesForUF ? codesForUF.includes(codigoIbge) : false;
}