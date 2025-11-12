import { Entity, Property, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { ContasBancarias } from '../conta-bancaria/conta-bancaria.entity';
import { MovimentacoesBancarias } from '../movimentacao-bancaria/movimentacao-bancaria.entity';
import { ExtratoBancarioRepository } from '../../extrato-bancario/extrato-bancario.repository';

export enum StatusExtratoItem {
  PENDENTE = 'pendente',
  SUGESTAO = 'sugestao',
  CONCILIADO = 'conciliado',
  IGNORADO = 'ignorado',
}

export enum TipoTransacao {
  DEBITO = 'debito',
  CREDITO = 'credito',
}

@Entity({
  tableName: 'extratos_bancarios',
  repository: () => ExtratoBancarioRepository,
})
export class ExtratoBancario {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => ContasBancarias, { fieldName: 'conta_bancaria_id' })
  contaBancaria!: ContasBancarias;

  @Property({ type: 'date', fieldName: 'data_transacao' })
  dataTransacao!: Date;

  @Property({ type: 'varchar', length: 500 })
  descricao!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  documento?: string;

  @Property({ type: 'decimal', precision: 15, scale: 2 })
  valor!: number;

  @Property({ type: 'varchar', length: 20, fieldName: 'tipo_transacao' })
  tipoTransacao!: TipoTransacao;

  @Property({ type: 'varchar', length: 20 })
  status: StatusExtratoItem = StatusExtratoItem.PENDENTE;

  @ManyToOne(() => MovimentacoesBancarias, {
    fieldName: 'movimentacao_sugerida_id',
    nullable: true,
  })
  movimentacaoSugerida?: MovimentacoesBancarias;

  @ManyToOne(() => MovimentacoesBancarias, {
    fieldName: 'movimentacao_conciliada_id',
    nullable: true,
  })
  movimentacaoConciliada?: MovimentacoesBancarias;

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  scoreMatch?: number; // Score de 0 a 100 da sugestão

  @Property({ type: 'text', nullable: true })
  observacao?: string;

  @Property({ type: 'varchar', length: 50, fieldName: 'formato_origem' })
  formatoOrigem!: string; // 'OFX' ou 'CSV'

  @Property({ type: 'varchar', length: 100, fieldName: 'nome_arquivo' })
  nomeArquivo!: string;

  @Property({ type: 'uuid', nullable: true })
  empresaId?: string;

  @Property({ type: 'uuid', nullable: true, fieldName: 'importado_por' })
  importadoPor?: string;

  @Property({ type: 'timestamp', onCreate: () => new Date() })
  criadoEm: Date = new Date();

  @Property({
    type: 'timestamp',
    onUpdate: () => new Date(),
    onCreate: () => new Date(),
  })
  atualizadoEm: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  deletadoEm?: Date;
}
