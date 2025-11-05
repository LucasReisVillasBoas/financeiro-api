import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CancelarContaPagarDto {
  @IsString()
  @IsNotEmpty({ message: 'Justificativa de cancelamento é obrigatória' })
  @MinLength(10, { message: 'Justificativa deve ter pelo menos 10 caracteres' })
  justificativa!: string;
}
