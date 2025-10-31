import { Migration } from '@mikro-orm/migrations';

export class Migration20251030192544_ajustar_contas_bancarias_completo extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" drop constraint if exists "contas_bancarias_empresa_id_foreign";`);

    this.addSql(`alter table "contas_bancarias" add column "cliente_id" varchar(255) null;`);
    this.addSql(`alter table "contas_bancarias" add column "agencia_digito" varchar(5) null;`);
    this.addSql(`alter table "contas_bancarias" add column "conta_digito" varchar(5) null;`);
    this.addSql(`alter table "contas_bancarias" add column "saldo_inicial" numeric(15,2) null;`);
    this.addSql(`alter table "contas_bancarias" add column "data_referencia_saldo" date null;`);

    this.addSql(`update "contas_bancarias" set "conta_digito" = "digito" where "digito" is not null;`);

    this.addSql(`update "contas_bancarias" set "saldo_inicial" = "saldo_disponivel";`);

    this.addSql(`update "contas_bancarias" set "data_referencia_saldo" = "criado_em"::date;`);

    this.addSql(`
      update "contas_bancarias" cb
      set "cliente_id" = e.cliente_id
      from "empresa" e
      where cb.empresa_id = e.id;
    `);

    this.addSql(`alter table "contas_bancarias" drop column if exists "digito";`);
    this.addSql(`alter table "contas_bancarias" drop column if exists "saldo_disponivel";`);

    this.addSql(`alter table "contas_bancarias" alter column "cliente_id" set not null;`);
    this.addSql(`alter table "contas_bancarias" alter column "saldo_inicial" set not null;`);
    this.addSql(`alter table "contas_bancarias" alter column "data_referencia_saldo" set not null;`);
    this.addSql(`alter table "contas_bancarias" alter column "empresa_id" set not null;`);

    this.addSql(`alter table "contas_bancarias" rename column "tipo_conta" to "tipo";`);

    this.addSql(`alter table "contas_bancarias" add constraint "contas_bancarias_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade on delete cascade;`);

    this.addSql(`create index "contas_bancarias_cliente_id_index" on "contas_bancarias" ("cliente_id");`);
    this.addSql(`create index "contas_bancarias_empresa_id_index" on "contas_bancarias" ("empresa_id");`);
    this.addSql(`create index "contas_bancarias_banco_index" on "contas_bancarias" ("banco");`);
    this.addSql(`create index "contas_bancarias_agencia_index" on "contas_bancarias" ("agencia");`);
    this.addSql(`create index "contas_bancarias_descricao_index" on "contas_bancarias" ("descricao");`);

    this.addSql(`
      create unique index "contas_bancarias_unique_idx" on "contas_bancarias"
      ("cliente_id", "empresa_id", "banco", "agencia", "conta", "conta_digito")
      where "deletado_em" is null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" drop constraint "contas_bancarias_empresa_id_foreign";`);

    this.addSql(`drop index "contas_bancarias_cliente_id_index";`);
    this.addSql(`drop index "contas_bancarias_empresa_id_index";`);
    this.addSql(`drop index "contas_bancarias_banco_index";`);
    this.addSql(`drop index "contas_bancarias_agencia_index";`);
    this.addSql(`drop index "contas_bancarias_descricao_index";`);
    this.addSql(`alter table "contas_bancarias" drop constraint "contas_bancarias_cliente_id_empresa_id_banco_agen_87bc4_unique";`);
    this.addSql(`alter table "contas_bancarias" drop column "cliente_id", drop column "agencia_digito", drop column "conta_digito", drop column "saldo_inicial", drop column "data_referencia_saldo";`);

    this.addSql(`alter table "contas_bancarias" add column "digito" varchar(10) null, add column "saldo_disponivel" numeric(15,2) not null default 0;`);
    this.addSql(`alter table "contas_bancarias" alter column "empresa_id" drop default;`);
    this.addSql(`alter table "contas_bancarias" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`);
    this.addSql(`alter table "contas_bancarias" alter column "empresa_id" drop not null;`);
    this.addSql(`alter table "contas_bancarias" rename column "tipo" to "tipo_conta";`);
    this.addSql(`alter table "contas_bancarias" add constraint "contas_bancarias_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade on delete set null;`);
  }

}
