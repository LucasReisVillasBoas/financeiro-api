import { Migration } from '@mikro-orm/migrations';

export class Migration20250916215601 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "perfil" ("id" uuid not null default gen_random_uuid(), "cliente_id" varchar(255) not null, "nome" varchar(255) not null, "permissoes" jsonb not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, constraint "perfil_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "perfis" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "perfis" ("id" varchar(255) not null, "cliente_id" varchar(255) not null, "nome" varchar(255) not null, "permissoes" jsonb not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, constraint "perfis_pkey" primary key ("id"));`);

    this.addSql(`drop table if exists "perfil" cascade;`);
  }

}
