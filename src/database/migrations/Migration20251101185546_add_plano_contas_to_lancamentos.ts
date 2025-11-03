import { Migration } from '@mikro-orm/migrations';

export class Migration20251101185546_add_plano_contas_to_lancamentos extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index "plano_contas_empresa_id_codigo_index";`);
    this.addSql(`alter table "plano_contas" drop constraint "plano_contas_empresa_id_codigo_unique";`);

    this.addSql(`alter table "movimentacoes_bancarias" add column "plano_contas_id" uuid null;`);
    this.addSql(`alter table "movimentacoes_bancarias" add constraint "movimentacoes_bancarias_plano_contas_id_foreign" foreign key ("plano_contas_id") references "plano_contas" ("id") on update cascade on delete restrict;`);
    this.addSql(`create index "movimentacoes_bancarias_plano_contas_id_index" on "movimentacoes_bancarias" ("plano_contas_id");`);

    this.addSql(`alter table "contas_receber" add column "plano_contas_id" uuid null;`);
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_plano_contas_id_foreign" foreign key ("plano_contas_id") references "plano_contas" ("id") on update cascade on delete restrict;`);
    this.addSql(`create index "contas_receber_plano_contas_id_index" on "contas_receber" ("plano_contas_id");`);

    this.addSql(`alter table "contas_pagar" add column "plano_contas_id" uuid null;`);
    this.addSql(`alter table "contas_pagar" add constraint "contas_pagar_plano_contas_id_foreign" foreign key ("plano_contas_id") references "plano_contas" ("id") on update cascade on delete restrict;`);
    this.addSql(`create index "contas_pagar_plano_contas_id_index" on "contas_pagar" ("plano_contas_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index "contas_pagar_plano_contas_id_index";`);
    this.addSql(`alter table "contas_pagar" drop constraint "contas_pagar_plano_contas_id_foreign";`);
    this.addSql(`alter table "contas_pagar" drop column "plano_contas_id";`);

    this.addSql(`drop index "contas_receber_plano_contas_id_index";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_plano_contas_id_foreign";`);
    this.addSql(`alter table "contas_receber" drop column "plano_contas_id";`);

    this.addSql(`drop index "movimentacoes_bancarias_plano_contas_id_index";`);
    this.addSql(`alter table "movimentacoes_bancarias" drop constraint "movimentacoes_bancarias_plano_contas_id_foreign";`);
    this.addSql(`alter table "movimentacoes_bancarias" drop column "plano_contas_id";`);

    this.addSql(`create index "plano_contas_empresa_id_codigo_index" on "plano_contas" ("empresa_id", "codigo");`);
    this.addSql(`alter table "plano_contas" add constraint "plano_contas_empresa_id_codigo_unique" unique ("empresa_id", "codigo");`);
  }

}
