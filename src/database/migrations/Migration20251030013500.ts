import { Migration } from '@mikro-orm/migrations';

export class Migration20251030013500 extends Migration {
  override async up(): Promise<void> {
    // Remover índices relacionados às colunas
    this.addSql(`drop index if exists "auditoria_cliente_id_data_hora_index";`);
    this.addSql(`drop index if exists "auditoria_cliente_id_index";`);
    this.addSql(`drop index if exists "auditoria_filial_id_index";`);

    // Remover colunas duplicadas
    this.addSql(`alter table "auditoria" drop column if exists "filial_id";`);
    this.addSql(`alter table "auditoria" drop column if exists "cliente_id";`);
  }

  override async down(): Promise<void> {
    // Recriar colunas
    this.addSql(`alter table "auditoria" add column "filial_id" uuid null;`);
    this.addSql(`alter table "auditoria" add column "cliente_id" uuid null;`);

    // Recriar índices
    this.addSql(
      `create index "auditoria_filial_id_index" on "auditoria" ("filial_id");`,
    );
    this.addSql(
      `create index "auditoria_cliente_id_index" on "auditoria" ("cliente_id");`,
    );
    this.addSql(
      `create index "auditoria_cliente_id_data_hora_index" on "auditoria" ("cliente_id", "data_hora");`,
    );

    // Recriar foreign key para filial
    this.addSql(`
      alter table "auditoria"
      add constraint "auditoria_filial_id_foreign"
      foreign key ("filial_id")
      references "empresa" ("id")
      on update cascade on delete set null;
    `);
  }
}
