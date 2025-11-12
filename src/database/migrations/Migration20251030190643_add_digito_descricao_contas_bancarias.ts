import { Migration } from '@mikro-orm/migrations';

export class Migration20251030190643_add_digito_descricao_contas_bancarias extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "contas_bancarias" add column "digito" varchar(10) null;`,
    );
    this.addSql(
      `alter table "contas_bancarias" add column "descricao" varchar(255) null;`,
    );

    this.addSql(
      `update "contas_bancarias" set "descricao" = CONCAT('Conta ', banco, ' - ', conta) where "descricao" is null;`,
    );

    this.addSql(
      `alter table "contas_bancarias" alter column "descricao" set not null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" drop column "digito";`);
    this.addSql(`alter table "contas_bancarias" drop column "descricao";`);
  }
}
