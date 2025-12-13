import { Migration } from '@mikro-orm/migrations';

export class Migration20251212215622_alterar_tamanho_colunas_criptografadas extends Migration {

  override async up(): Promise<void> {
    // Alterar colunas criptografadas de contas_bancarias para TEXT
    // para acomodar valores criptografados (formato: iv:encrypted:authTag)
    this.addSql(`alter table "contas_bancarias" alter column "banco" type text using ("banco"::text);`);
    this.addSql(`alter table "contas_bancarias" alter column "agencia" type text using ("agencia"::text);`);
    this.addSql(`alter table "contas_bancarias" alter column "agencia_digito" type text using ("agencia_digito"::text);`);
    this.addSql(`alter table "contas_bancarias" alter column "conta" type text using ("conta"::text);`);
    this.addSql(`alter table "contas_bancarias" alter column "conta_digito" type text using ("conta_digito"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "contas_bancarias" alter column "banco" type varchar(255) using ("banco"::varchar(255));`);
    this.addSql(`alter table "contas_bancarias" alter column "agencia" type varchar(50) using ("agencia"::varchar(50));`);
    this.addSql(`alter table "contas_bancarias" alter column "agencia_digito" type varchar(5) using ("agencia_digito"::varchar(5));`);
    this.addSql(`alter table "contas_bancarias" alter column "conta" type varchar(50) using ("conta"::varchar(50));`);
    this.addSql(`alter table "contas_bancarias" alter column "conta_digito" type varchar(5) using ("conta_digito"::varchar(5));`);
  }

}
