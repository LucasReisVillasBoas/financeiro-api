import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CancelarContaReceberDto {
  @IsString()
  @IsNotEmpty({ message: 'Justificativa é obrigatória para cancelamento' })
  @MinLength(10, { message: 'Justificativa deve ter no mínimo 10 caracteres' })
  @MaxLength(500, { message: 'Justificativa deve ter no máximo 500 caracteres' })
  justificativa!: string;
}
