import { Migration } from '@mikro-orm/migrations';

export class Migration20250924221441_CreateCidadeTable extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table "cidade" (
      "id" uuid not null default gen_random_uuid(),
      "cliente_id" uuid not null,
      "filial_id" uuid null,
      "nome" varchar(255) not null,
      "codigo_ibge" varchar(7) not null,
      "uf" varchar(2) not null,
      "pais" varchar(100) not null default 'Brasil',
      "codigo_bacen" varchar(10) null,
      "criado_em" timestamptz not null default now(),
      "atualizado_em" timestamptz not null default now(),
      constraint "cidade_pkey" primary key ("id")
    );`);

    this.addSql(
      `create index "cidade_cliente_id_index" on "cidade" ("cliente_id");`,
    );
    this.addSql(
      `create index "cidade_filial_id_index" on "cidade" ("filial_id");`,
    );
    this.addSql(
      `create index "cidade_codigo_ibge_index" on "cidade" ("codigo_ibge");`,
    );
    this.addSql(
      `create unique index "cidade_codigo_ibge_cliente_id_unique" on "cidade" ("codigo_ibge", "cliente_id");`,
    );

    this.addSql(
      `alter table "cidade" add constraint "cidade_filial_id_foreign" foreign key ("filial_id") references "empresa" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "cidade" add constraint "usuario_id_foreign" foreign key ("cliente_id") references "usuario" ("id") on update cascade on delete cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cidade" cascade;`);
  }
}
