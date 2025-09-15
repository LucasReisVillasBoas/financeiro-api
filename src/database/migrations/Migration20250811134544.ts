import { Migration } from '@mikro-orm/migrations';

export class Migration20250811134544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "empresa" drop constraint "empresa_endereco_id_foreign";`);

    this.addSql(`alter table "empresa" alter column "endereco_id" type int using ("endereco_id"::int);`);
    this.addSql(`alter table "empresa" alter column "endereco_id" drop not null;`);
    this.addSql(`alter table "empresa" add constraint "empresa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "empresa" drop constraint "empresa_endereco_id_foreign";`);

    this.addSql(`alter table "empresa" alter column "endereco_id" type int using ("endereco_id"::int);`);
    this.addSql(`alter table "empresa" alter column "endereco_id" set not null;`);
    this.addSql(`alter table "empresa" add constraint "empresa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade;`);
  }

}
