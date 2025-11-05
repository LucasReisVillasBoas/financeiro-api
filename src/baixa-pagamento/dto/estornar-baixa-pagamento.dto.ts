import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class EstornarBaixaPagamentoDto {
  @IsString({ message: 'Justificativa deve ser um texto' })
  @IsNotEmpty({ message: 'Justificativa é obrigatória' })
  @MinLength(10, { message: 'Justificativa deve ter pelo menos 10 caracteres' })
  justificativa!: string;
}
