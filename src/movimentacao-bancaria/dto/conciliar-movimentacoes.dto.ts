import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class ConciliarMovimentacoesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecione ao menos uma movimentação' })
  @IsUUID('4', { each: true, message: 'IDs inválidos' })
  movimentacaoIds!: string[];
}
