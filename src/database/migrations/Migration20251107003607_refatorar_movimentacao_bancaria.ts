import { Migration } from '@mikro-orm/migrations';

export class Migration20251107003607_refatorar_movimentacao_bancaria extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "movimentacoes_bancarias" add column "observacao" text null, add column "conciliado" char(1) not null default 'N', add column "referencia" varchar(20) null;`);
    this.addSql(`alter table "movimentacoes_bancarias" rename column "data" to "data_movimento";`);
    this.addSql(`alter table "movimentacoes_bancarias" rename column "tipo" to "tipo_movimento";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "movimentacoes_bancarias" drop column "observacao", drop column "conciliado", drop column "referencia";`);

    this.addSql(`alter table "movimentacoes_bancarias" rename column "data_movimento" to "data";`);
    this.addSql(`alter table "movimentacoes_bancarias" rename column "tipo_movimento" to "tipo";`);
  }

}
