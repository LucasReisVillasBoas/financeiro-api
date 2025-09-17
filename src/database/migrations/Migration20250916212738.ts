import { Migration } from '@mikro-orm/migrations';

export class Migration20250916212738 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "perfis" ("id" serial primary key, "cliente_id" int not null, "nome" varchar(255) not null, "permissoes" jsonb not null, "ativo" boolean not null default true, "deletado_em" timestamptz null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "perfis" cascade;`);
  }

}
