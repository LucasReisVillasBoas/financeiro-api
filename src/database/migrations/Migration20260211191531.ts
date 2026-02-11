import { Migration } from '@mikro-orm/migrations';

export class Migration20260211191531 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
    alter table "contas_bancarias"
    drop column "saldo_inicial",
    drop column "saldo_atual";
  `);

    this.addSql(`
    alter table "contas_bancarias"
    add column "saldo_inicial" numeric(15,2) not null default 0,
    add column "saldo_atual" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "movimentacoes_bancarias"
    drop column "valor";
  `);

    this.addSql(`
    alter table "movimentacoes_bancarias"
    add column "valor" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "extratos_bancarios"
    drop column "valor";
  `);

    this.addSql(`
    alter table "extratos_bancarios"
    add column "valor" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "contas_receber"
    drop column "valor_principal",
    drop column "valor_total",
    drop column "saldo";
  `);

    this.addSql(`
    alter table "contas_receber"
    add column "valor_principal" numeric(15,2) not null default 0,
    add column "valor_total" numeric(15,2) not null default 0,
    add column "saldo" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "baixas_recebimento"
    drop column "valor",
    drop column "total",
    drop column "saldo_anterior",
     drop column "saldo_posterior";
  `);

    this.addSql(`
    alter table "baixas_recebimento"
    add column "valor" numeric(15,2) not null default 0,
    add column "total" numeric(15,2) not null default 0,
    add column "saldo_anterior" numeric(15,2) not null default 0,
    add column "saldo_posterior" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "contas_pagar"
    drop column "valor_principal",
    drop column "valor_total",
    drop column "saldo";
  `);

    this.addSql(`
    alter table "contas_pagar"
    add column "valor_principal" numeric(15,2) not null default 0,
    add column "valor_total" numeric(15,2) not null default 0,
    add column "saldo" numeric(15,2) not null default 0;
  `);

    this.addSql(`
    alter table "baixas_pagamento"
    drop column "valor",
    drop column "total",
    drop column "saldo_anterior",
     drop column "saldo_posterior";
  `);

    this.addSql(`
    alter table "baixas_pagamento"
    add column "valor" numeric(15,2) not null default 0,
    add column "total" numeric(15,2) not null default 0,
    add column "saldo_anterior" numeric(15,2) not null default 0,
    add column "saldo_posterior" numeric(15,2) not null default 0;
  `);
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "contas_bancarias" alter column "saldo_inicial" type text using ("saldo_inicial"::text);`,
    );
    this.addSql(
      `alter table "contas_bancarias" alter column "saldo_atual" type text using ("saldo_atual"::text);`,
    );

    this.addSql(
      `alter table "movimentacoes_bancarias" alter column "valor" type text using ("valor"::text);`,
    );

    this.addSql(
      `alter table "extratos_bancarios" alter column "valor" type text using ("valor"::text);`,
    );

    this.addSql(
      `alter table "contas_receber" alter column "valor_principal" type text using ("valor_principal"::text);`,
    );
    this.addSql(
      `alter table "contas_receber" alter column "valor_total" type text using ("valor_total"::text);`,
    );
    this.addSql(
      `alter table "contas_receber" alter column "saldo" type text using ("saldo"::text);`,
    );

    this.addSql(
      `alter table "baixas_recebimento" alter column "valor" type text using ("valor"::text);`,
    );
    this.addSql(
      `alter table "baixas_recebimento" alter column "total" type text using ("total"::text);`,
    );
    this.addSql(
      `alter table "baixas_recebimento" alter column "saldo_anterior" type text using ("saldo_anterior"::text);`,
    );
    this.addSql(
      `alter table "baixas_recebimento" alter column "saldo_posterior" type text using ("saldo_posterior"::text);`,
    );

    this.addSql(
      `alter table "contas_pagar" alter column "valor_principal" type text using ("valor_principal"::text);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "valor_total" type text using ("valor_total"::text);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "saldo" type text using ("saldo"::text);`,
    );

    this.addSql(
      `alter table "baixas_pagamento" alter column "valor" type text using ("valor"::text);`,
    );
    this.addSql(
      `alter table "baixas_pagamento" alter column "total" type text using ("total"::text);`,
    );
    this.addSql(
      `alter table "baixas_pagamento" alter column "saldo_anterior" type text using ("saldo_anterior"::text);`,
    );
    this.addSql(
      `alter table "baixas_pagamento" alter column "saldo_posterior" type text using ("saldo_posterior"::text);`,
    );
  }
}
