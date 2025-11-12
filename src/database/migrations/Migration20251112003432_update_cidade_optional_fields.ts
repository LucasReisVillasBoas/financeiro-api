import { Migration } from '@mikro-orm/migrations';

export class Migration20251112003432_update_cidade_optional_fields extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "cidade" alter column "codigo_ibge" type varchar(20) using ("codigo_ibge"::varchar(20));`);
    this.addSql(`alter table "cidade" alter column "codigo_ibge" drop not null;`);
    this.addSql(`alter table "cidade" alter column "uf" type varchar(2) using ("uf"::varchar(2));`);
    this.addSql(`alter table "cidade" alter column "uf" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "cidade" alter column "codigo_ibge" type varchar(7) using ("codigo_ibge"::varchar(7));`);
    this.addSql(`alter table "cidade" alter column "codigo_ibge" set not null;`);
    this.addSql(`alter table "cidade" alter column "uf" type varchar(2) using ("uf"::varchar(2));`);
    this.addSql(`alter table "cidade" alter column "uf" set not null;`);
  }

}
