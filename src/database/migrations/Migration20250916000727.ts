import { Migration } from '@mikro-orm/migrations';

export class Migration20250916000727 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "filial" alter column "empresa_id" drop default;`);
    this.addSql(`alter table "filial" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`);
    this.addSql(`alter table "filial" add constraint "filial_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "filial" alter column "empresa_id" type text using ("empresa_id"::text);`);

    this.addSql(`alter table "filial" drop constraint "filial_empresa_id_foreign";`);

    this.addSql(`alter table "filial" alter column "empresa_id" type varchar(255) using ("empresa_id"::varchar(255));`);
  }

}
