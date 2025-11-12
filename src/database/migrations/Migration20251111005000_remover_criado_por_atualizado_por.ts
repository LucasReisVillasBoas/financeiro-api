import { Migration } from '@mikro-orm/migrations';

export class Migration20251111005000RemoverCriadoPorAtualizadoPor extends Migration {

  override async up(): Promise<void> {
    // Remover foreign keys
    this.addSql(`alter table "pessoa" drop constraint if exists "pessoa_criado_por_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint if exists "pessoa_atualizado_por_id_foreign";`);

    // Remover índices
    this.addSql(`drop index if exists "pessoa_criado_por_id_index";`);
    this.addSql(`drop index if exists "pessoa_atualizado_por_id_index";`);

    // Remover colunas
    this.addSql(`alter table "pessoa" drop column if exists "criado_por_id";`);
    this.addSql(`alter table "pessoa" drop column if exists "atualizado_por_id";`);
  }

  override async down(): Promise<void> {
    // Recriar colunas
    this.addSql(`alter table "pessoa" add column "criado_por_id" uuid null;`);
    this.addSql(`alter table "pessoa" add column "atualizado_por_id" uuid null;`);

    // Recriar índices
    this.addSql(`create index "pessoa_criado_por_id_index" on "pessoa" ("criado_por_id");`);
    this.addSql(`create index "pessoa_atualizado_por_id_index" on "pessoa" ("atualizado_por_id");`);

    // Recriar foreign keys
    this.addSql(`alter table "pessoa" add constraint "pessoa_criado_por_id_foreign" foreign key ("criado_por_id") references "usuario" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_atualizado_por_id_foreign" foreign key ("atualizado_por_id") references "usuario" ("id") on update cascade on delete set null;`);
  }

}
