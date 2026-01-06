import { Migration } from '@mikro-orm/migrations';

export class Migration20260106223308_Migration20260106_alterar_saldo_para_text extends Migration {

  override async up(): Promise<void> {
    // Alterar saldo_inicial de numeric para text (preservando dados como string)
    this.addSql(`
      ALTER TABLE "contas_bancarias"
      ALTER COLUMN "saldo_inicial" TYPE text
      USING "saldo_inicial"::text;
    `);

    // Alterar saldo_atual de numeric para text (preservando dados como string)
    this.addSql(`
      ALTER TABLE "contas_bancarias"
      ALTER COLUMN "saldo_atual" TYPE text
      USING "saldo_atual"::text;
    `);
  }

  override async down(): Promise<void> {
    // Reverter saldo_inicial para numeric
    this.addSql(`
      ALTER TABLE "contas_bancarias"
      ALTER COLUMN "saldo_inicial" TYPE numeric(15,2)
      USING "saldo_inicial"::numeric(15,2);
    `);

    // Reverter saldo_atual para numeric
    this.addSql(`
      ALTER TABLE "contas_bancarias"
      ALTER COLUMN "saldo_atual" TYPE numeric(15,2)
      USING "saldo_atual"::numeric(15,2);
    `);
  }

}
