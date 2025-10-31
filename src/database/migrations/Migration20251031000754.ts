import { Migration } from '@mikro-orm/migrations';

export class Migration20251031000754 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" add column "saldo_atual" numeric(15,2) null;`);

    this.addSql(`update "contas_bancarias" set "saldo_atual" = "saldo_inicial" where "saldo_atual" is null;`);

    this.addSql(`alter table "contas_bancarias" alter column "saldo_atual" set not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" drop column "saldo_atual";`);
  }

}
