import { Migration } from '@mikro-orm/migrations';

export class Migration20250916000134 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "empresa" ("id" uuid not null default gen_random_uuid(), "cliente_id" varchar(255) not null, "razao_social" varchar(255) not null, "nome_fantasia" varchar(255) not null, "cnpj_cpf" varchar(255) not null, "inscricao_estadual" varchar(255) null, "inscricao_municipal" varchar(255) null, "cep" varchar(255) null, "logradouro" varchar(255) null, "numero" varchar(255) null, "bairro" varchar(255) null, "complemento" varchar(255) null, "cidade" varchar(255) null, "codigo_ibge" varchar(255) null, "uf" varchar(255) null, "telefone" varchar(255) null, "celular" varchar(255) null, "email" varchar(255) null, "data_abertura" timestamptz null, "data_inclusao" timestamptz not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, constraint "empresa_pkey" primary key ("id"));`);

    this.addSql(`create table "endereco" ("id" uuid not null default gen_random_uuid(), "cep" varchar(8) not null, "logradouro" varchar(60) not null, "numero" varchar(60) not null, "bairro" varchar(60) not null, "complemento" varchar(60) null, "cidade" varchar(60) not null, "codigo_ibge" varchar(7) not null, "uf" varchar(2) not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, constraint "endereco_pkey" primary key ("id"));`);

    this.addSql(`create table "filial" ("id" uuid not null default gen_random_uuid(), "empresa_id" varchar(255) not null, "razao_social" varchar(255) not null, "nome_fantasia" varchar(255) not null, "cnpj_cpf" varchar(255) not null, "inscricao_estadual" varchar(255) null, "inscricao_municipal" varchar(255) null, "cep" varchar(255) null, "logradouro" varchar(255) null, "numero" varchar(255) null, "bairro" varchar(255) null, "complemento" varchar(255) null, "cidade" varchar(255) null, "codigo_ibge" varchar(255) null, "uf" varchar(255) null, "telefone" varchar(255) null, "celular" varchar(255) null, "email" varchar(255) null, "data_abertura" timestamptz null, "data_inclusao" timestamptz not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, constraint "filial_pkey" primary key ("id"));`);

    this.addSql(`create table "tipo_contato" ("id" uuid not null default gen_random_uuid(), "nome" varchar(50) not null, "corporativo" boolean not null default false, constraint "tipo_contato_pkey" primary key ("id"));`);

    this.addSql(`create table "contato" ("id" uuid not null default gen_random_uuid(), "entity_type" varchar(50) not null, "entity_id" int not null, "tipo_contato_id" uuid not null, "descricao" varchar(100) not null, "ativo" boolean not null default true, "deletado_em" timestamptz null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, constraint "contato_pkey" primary key ("id"));`);
    this.addSql(`create index "contato_entity_type_index" on "contato" ("entity_type");`);
    this.addSql(`create index "contato_entity_id_index" on "contato" ("entity_id");`);

    this.addSql(`create table "usuario" ("id" uuid not null default gen_random_uuid(), "nome" varchar(100) not null, "cargo" varchar(100) null, "login" varchar(100) not null, "senha" varchar(255) not null, "telefone" varchar(14) null, "email" varchar(255) null, "ativo" boolean not null default true, "deletado_em" timestamptz null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, constraint "usuario_pkey" primary key ("id"));`);
    this.addSql(`create index "usuario_login_index" on "usuario" ("login");`);

    this.addSql(`create table "pessoa" ("id" uuid not null default gen_random_uuid(), "empresa_id" uuid not null, "endereco_id" uuid not null, "razao_nome" varchar(60) null, "fantasia_apelido" varchar(60) null, "documento" varchar(14) null, "ie_rg" varchar(14) null, "aniversario" timestamptz null, "ativo" boolean not null default true, "deletado_em" timestamptz null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "criado_por_id" uuid null, "atualizado_por_id" uuid null, constraint "pessoa_pkey" primary key ("id"));`);
    this.addSql(`create index "pessoa_empresa_id_index" on "pessoa" ("empresa_id");`);
    this.addSql(`create index "pessoa_endereco_id_index" on "pessoa" ("endereco_id");`);
    this.addSql(`create index "pessoa_criado_por_id_index" on "pessoa" ("criado_por_id");`);
    this.addSql(`create index "pessoa_atualizado_por_id_index" on "pessoa" ("atualizado_por_id");`);

    this.addSql(`create table "empresa_usuario" ("id" uuid not null default gen_random_uuid(), "empresa_id" uuid not null, "usuario_id" uuid not null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, constraint "empresa_usuario_pkey" primary key ("id"));`);
    this.addSql(`create index "empresa_usuario_empresa_id_index" on "empresa_usuario" ("empresa_id");`);
    this.addSql(`create index "empresa_usuario_usuario_id_index" on "empresa_usuario" ("usuario_id");`);

    this.addSql(`alter table "contato" add constraint "contato_tipo_contato_id_foreign" foreign key ("tipo_contato_id") references "tipo_contato" ("id") on update cascade;`);

    this.addSql(`alter table "pessoa" add constraint "pessoa_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_criado_por_id_foreign" foreign key ("criado_por_id") references "usuario" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_atualizado_por_id_foreign" foreign key ("atualizado_por_id") references "usuario" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "pessoa" drop constraint "pessoa_empresa_id_foreign";`);

    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_empresa_id_foreign";`);

    this.addSql(`alter table "pessoa" drop constraint "pessoa_endereco_id_foreign";`);

    this.addSql(`alter table "contato" drop constraint "contato_tipo_contato_id_foreign";`);

    this.addSql(`alter table "pessoa" drop constraint "pessoa_criado_por_id_foreign";`);

    this.addSql(`alter table "pessoa" drop constraint "pessoa_atualizado_por_id_foreign";`);

    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_usuario_id_foreign";`);

    this.addSql(`drop table if exists "empresa" cascade;`);

    this.addSql(`drop table if exists "endereco" cascade;`);

    this.addSql(`drop table if exists "filial" cascade;`);

    this.addSql(`drop table if exists "tipo_contato" cascade;`);

    this.addSql(`drop table if exists "contato" cascade;`);

    this.addSql(`drop table if exists "usuario" cascade;`);

    this.addSql(`drop table if exists "pessoa" cascade;`);

    this.addSql(`drop table if exists "empresa_usuario" cascade;`);
  }

}
