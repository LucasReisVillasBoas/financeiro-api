import { Migration } from '@mikro-orm/migrations';

export class Migration20251111004500AjustarTamanhoCamposFiscais extends Migration {

  override async up(): Promise<void> {
    // Aumentar tamanho do campo ie_rg de 14 para 20 caracteres
    this.addSql(`alter table "pessoa" alter column "ie_rg" type varchar(20);`);

    // Aumentar tamanho do campo im de 20 para 30 caracteres
    this.addSql(`alter table "pessoa" alter column "im" type varchar(30);`);
  }

  override async down(): Promise<void> {
    // Reverter para tamanhos originais
    this.addSql(`alter table "pessoa" alter column "ie_rg" type varchar(14);`);
    this.addSql(`alter table "pessoa" alter column "im" type varchar(20);`);
  }

}
