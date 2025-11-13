import { Migration } from '@mikro-orm/migrations';

export class Migration20251112234105_criar_tabela_baixas_recebimento extends Migration {

  override async up(): Promise<void> {
    // Cria tabela de baixas de recebimento
    this.addSql(`
      create table "baixas_recebimento" (
        "id" uuid not null default gen_random_uuid(),
        "conta_receber_id" uuid not null,
        "conta_bancaria_id" uuid not null,
        "data" date not null,
        "valor" numeric(15,2) not null,
        "acrescimos" numeric(15,2) not null default 0,
        "descontos" numeric(15,2) not null default 0,
        "total" numeric(15,2) not null,
        "tipo" varchar(20) not null,
        "observacao" text null,
        "movimentacao_bancaria_id" uuid null,
        "saldo_anterior" numeric(15,2) not null,
        "saldo_posterior" numeric(15,2) not null,
        "criado_em" timestamptz not null,
        "atualizado_em" timestamptz not null,
        "deletado_em" timestamptz null,
        "criado_por_id" uuid null,
        constraint "baixas_recebimento_pkey" primary key ("id")
      );
    `);

    // Adiciona foreign keys
    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_conta_receber_id_foreign"
      foreign key ("conta_receber_id")
      references "contas_receber" ("id")
      on update cascade
      on delete restrict;
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_conta_bancaria_id_foreign"
      foreign key ("conta_bancaria_id")
      references "contas_bancarias" ("id")
      on update cascade
      on delete restrict;
    `);

    // Adiciona índices para performance
    this.addSql(`
      create index "baixas_recebimento_conta_receber_id_index"
      on "baixas_recebimento" ("conta_receber_id");
    `);

    this.addSql(`
      create index "baixas_recebimento_conta_bancaria_id_index"
      on "baixas_recebimento" ("conta_bancaria_id");
    `);

    this.addSql(`
      create index "baixas_recebimento_data_index"
      on "baixas_recebimento" ("data");
    `);

    // Adiciona constraints de validação
    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_valor_check"
      check ("valor" >= 0);
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_acrescimos_check"
      check ("acrescimos" >= 0);
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_descontos_check"
      check ("descontos" >= 0);
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_total_check"
      check ("total" >= 0);
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_saldo_anterior_check"
      check ("saldo_anterior" >= 0);
    `);

    this.addSql(`
      alter table "baixas_recebimento"
      add constraint "baixas_recebimento_saldo_posterior_check"
      check ("saldo_posterior" >= 0);
    `);
  }

  override async down(): Promise<void> {
    // Remove constraints
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_saldo_posterior_check";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_saldo_anterior_check";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_total_check";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_descontos_check";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_acrescimos_check";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_valor_check";`);

    // Remove índices
    this.addSql(`drop index "baixas_recebimento_data_index";`);
    this.addSql(`drop index "baixas_recebimento_conta_bancaria_id_index";`);
    this.addSql(`drop index "baixas_recebimento_conta_receber_id_index";`);

    // Remove foreign keys
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_conta_bancaria_id_foreign";`);
    this.addSql(`alter table "baixas_recebimento" drop constraint "baixas_recebimento_conta_receber_id_foreign";`);

    // Remove tabela
    this.addSql(`drop table if exists "baixas_recebimento" cascade;`);
  }

}
