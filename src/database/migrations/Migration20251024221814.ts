import { Migration } from '@mikro-orm/migrations';

export class Migration20251024221814 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "contas_pagar" ("id" uuid not null, "descricao" varchar(500) not null, "valor" numeric(15,2) not null, "vencimento" date not null, "status" varchar(50) not null, "fornecedor" varchar(255) not null, "data_pagamento" date null, "empresa_id" uuid null, "filial_id" uuid null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, constraint "contas_pagar_pkey" primary key ("id"));`);

    this.addSql(`create table "contas_receber" ("id" uuid not null, "descricao" varchar(500) not null, "valor" numeric(15,2) not null, "vencimento" date not null, "status" varchar(50) not null, "cliente" varchar(255) not null, "data_recebimento" date null, "empresa_id" uuid null, "filial_id" uuid null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, constraint "contas_receber_pkey" primary key ("id"));`);

    this.addSql(`create table "contas_bancarias" ("id" uuid not null, "banco" varchar(255) not null, "agencia" varchar(50) not null, "conta" varchar(50) not null, "tipo_conta" varchar(50) not null, "saldo_disponivel" numeric(15,2) not null default 0, "ativo" boolean not null default true, "empresa_id" uuid null, "filial_id" uuid null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, constraint "contas_bancarias_pkey" primary key ("id"));`);

    this.addSql(`create table "movimentacoes_bancarias" ("id" uuid not null, "data" date not null, "descricao" varchar(500) not null, "conta" varchar(255) not null, "categoria" varchar(255) not null, "valor" numeric(15,2) not null, "tipo" varchar(20) not null, "conta_bancaria_id" uuid not null, "empresa_id" uuid null, "filial_id" uuid null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, constraint "movimentacoes_bancarias_pkey" primary key ("id"));`);

    this.addSql(`alter table "contas_bancarias" add constraint "contas_bancarias_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "movimentacoes_bancarias" add constraint "movimentacoes_bancarias_conta_bancaria_id_foreign" foreign key ("conta_bancaria_id") references "contas_bancarias" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "movimentacoes_bancarias" drop constraint "movimentacoes_bancarias_conta_bancaria_id_foreign";`);

    this.addSql(`drop table if exists "contas_pagar" cascade;`);

    this.addSql(`drop table if exists "contas_receber" cascade;`);

    this.addSql(`drop table if exists "contas_bancarias" cascade;`);

    this.addSql(`drop table if exists "movimentacoes_bancarias" cascade;`);
  }

}
