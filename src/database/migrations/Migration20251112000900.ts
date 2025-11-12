import { Migration } from '@mikro-orm/migrations';

export class Migration20251112000900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "usuario" alter column "telefone" type varchar(20) using ("telefone"::varchar(20));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "usuario" alter column "telefone" type varchar(14) using ("telefone"::varchar(14));`);
  }

}
