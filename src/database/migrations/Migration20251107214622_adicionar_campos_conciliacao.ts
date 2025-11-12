import { Migration } from '@mikro-orm/migrations';

export class Migration20251107214622_adicionar_campos_conciliacao extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "movimentacoes_bancarias" add column "conciliado_em" timestamptz null, add column "conciliado_por" uuid null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "movimentacoes_bancarias" drop column "conciliado_em", drop column "conciliado_por";`,
    );
  }
}
