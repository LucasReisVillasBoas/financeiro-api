import { Migration } from '@mikro-orm/migrations';

export class Migration20250916213946 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "perfis" alter column "id" type varchar(255) using ("id"::varchar(255));`);
    this.addSql(`alter table "perfis" alter column "cliente_id" type varchar(255) using ("cliente_id"::varchar(255));`);
    this.addSql(`alter table "perfis" alter column "id" drop default;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "perfis" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "perfis" alter column "cliente_id" type int using ("cliente_id"::int);`);
    this.addSql(`create sequence if not exists "perfis_id_seq";`);
    this.addSql(`select setval('perfis_id_seq', (select max("id") from "perfis"));`);
    this.addSql(`alter table "perfis" alter column "id" set default nextval('perfis_id_seq');`);
  }

}
