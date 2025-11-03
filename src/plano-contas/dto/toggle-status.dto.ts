import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleStatusDto {
  @IsBoolean()
  @IsNotEmpty({ message: 'Status ativo é obrigatório' })
  ativo!: boolean;
}
