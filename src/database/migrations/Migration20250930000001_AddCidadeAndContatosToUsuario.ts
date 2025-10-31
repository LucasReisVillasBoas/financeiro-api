import { Migration } from '@mikro-orm/migrations';

export class Migration20250930000001_AddCidadeAndContatosToUsuario extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "usuario" add column "cidade_id" uuid null;');

    this.addSql(
      'create index "usuario_cidade_id_index" on "usuario" ("cidade_id");',
    );

    this.addSql(
      'alter table "usuario" add constraint "usuario_cidade_id_foreign" foreign key ("cidade_id") references "cidade" ("id") on update cascade on delete set null;',
    );

    this.addSql(`create table "usuario_contato" (
      "id" uuid not null default gen_random_uuid(),
      "usuario_id" uuid not null,
      "contato_id" uuid not null,
      "criado_em" timestamptz not null default now(),
      constraint "usuario_contato_pkey" primary key ("id")
    );`);

    this.addSql(
      'create index "usuario_contato_usuario_id_index" on "usuario_contato" ("usuario_id");',
    );
    this.addSql(
      'create index "usuario_contato_contato_id_index" on "usuario_contato" ("contato_id");',
    );

    this.addSql(
      'create unique index "usuario_contato_usuario_id_contato_id_unique" on "usuario_contato" ("usuario_id", "contato_id");',
    );

    this.addSql(
      'alter table "usuario_contato" add constraint "usuario_contato_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade on delete cascade;',
    );
    this.addSql(
      'alter table "usuario_contato" add constraint "usuario_contato_contato_id_foreign" foreign key ("contato_id") references "contato" ("id") on update cascade on delete cascade;',
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "usuario_contato" cascade;');

    this.addSql(
      'alter table "usuario" drop constraint if exists "usuario_cidade_id_foreign";',
    );
    this.addSql('drop index if exists "usuario_cidade_id_index";');
    this.addSql('alter table "usuario" drop column if exists "cidade_id";');
  }
}
