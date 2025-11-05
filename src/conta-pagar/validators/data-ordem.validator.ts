import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsDataOrdemValida', async: false })
export class IsDataOrdemValidaConstraint implements ValidatorConstraintInterface {
  validate(dataLiquidacao: any, args: ValidationArguments) {
    const object = args.object as any;
    const dataEmissao = new Date(object.data_emissao);
    const vencimento = new Date(object.vencimento);
    const liquidacao = dataLiquidacao ? new Date(dataLiquidacao) : null;

    // Valida: data_emissao <= vencimento
    if (dataEmissao > vencimento) {
      return false;
    }

    // Se houver data_liquidacao, valida: vencimento <= data_liquidacao
    if (liquidacao && vencimento > liquidacao) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'As datas devem seguir a ordem: data_emissao ≤ vencimento ≤ data_liquidacao';
  }
}

export function IsDataOrdemValida(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDataOrdemValidaConstraint,
    });
  };
}
