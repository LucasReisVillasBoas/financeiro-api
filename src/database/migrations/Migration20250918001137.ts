import { Migration } from '@mikro-orm/migrations';

export class Migration20250918001137 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "usuario_empresa_filial" drop constraint "usuario_empresa_filial_filial_id_foreign";`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" drop constraint "usuario_empresa_filial_empresa_id_foreign";`,
    );

    this.addSql(`drop index "usuario_empresa_filial_filial_id_index";`);
    this.addSql(
      `alter table "usuario_empresa_filial" drop column "filial_id";`,
    );

    this.addSql(
      `alter table "usuario_empresa_filial" add column "filial" boolean not null default false;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" drop default;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" set not null;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" add constraint "usuario_empresa_filial_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "usuario_empresa_filial" drop constraint "usuario_empresa_filial_empresa_id_foreign";`,
    );

    this.addSql(`alter table "usuario_empresa_filial" drop column "filial";`);

    this.addSql(
      `alter table "usuario_empresa_filial" add column "filial_id" uuid null;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" drop default;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" alter column "empresa_id" drop not null;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" add constraint "usuario_empresa_filial_filial_id_foreign" foreign key ("filial_id") references "empresa" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "usuario_empresa_filial" add constraint "usuario_empresa_filial_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `create index "usuario_empresa_filial_filial_id_index" on "usuario_empresa_filial" ("filial_id");`,
    );
  }
}
