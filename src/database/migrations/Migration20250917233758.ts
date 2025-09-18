import { Migration } from '@mikro-orm/migrations';

export class Migration20250917233758 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "usuario_perfil" ("id" uuid not null default gen_random_uuid(), "perfil_id" uuid not null, "usuario_id" uuid not null, "empresa_id" uuid not null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, constraint "usuario_perfil_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "usuario_perfil_perfil_id_index" on "usuario_perfil" ("perfil_id");`,
    );
    this.addSql(
      `create index "usuario_perfil_usuario_id_index" on "usuario_perfil" ("usuario_id");`,
    );

    this.addSql(
      `create index "usuario_perfil_empresa_id_index" on "usuario_perfil" ("empresa_id");`,
    );
    this.addSql(
      `alter table "usuario_perfil" add constraint "usuario_perfil_perfil_id_foreign" foreign key ("perfil_id") references "perfil" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "usuario_perfil" add constraint "usuario_perfil_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "usuario_perfil" add constraint "usuario_perfil_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "usuario_perfil" cascade;`);
  }
}
