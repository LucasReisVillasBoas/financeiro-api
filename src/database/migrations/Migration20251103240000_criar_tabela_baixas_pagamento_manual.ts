import { Migration } from '@mikro-orm/migrations';

export class Migration20251103240000_criar_tabela_baixas_pagamento_manual extends Migration {
  override async up(): Promise<void> {
    // Cria tabela baixas_pagamento
    this.addSql(`
      create table "baixas_pagamento" (
        "id" uuid not null default gen_random_uuid(),
        "conta_pagar_id" uuid not null,
        "conta_bancaria_id" uuid not null,
        "data" date not null,
        "valor" numeric(15,2) not null,
        "acrescimos" numeric(15,2) not null default 0,
        "descontos" numeric(15,2) not null default 0,
        "total" numeric(15,2) not null,
        "tipo" varchar(10) not null,
        "observacao" text null,
        "movimentacao_bancaria_id" uuid null,
        "saldo_anterior" numeric(15,2) not null,
        "saldo_posterior" numeric(15,2) not null,
        "criado_em" timestamptz not null default now(),
        "atualizado_em" timestamptz not null default now(),
        "deletado_em" timestamptz null,
        "criado_por_id" uuid null,
        constraint "baixas_pagamento_pkey" primary key ("id")
      );
    `);

    // Adiciona foreign keys
    this.addSql(`
      alter table "baixas_pagamento"
      add constraint "baixas_pagamento_conta_pagar_id_foreign"
      foreign key ("conta_pagar_id")
      references "contas_pagar" ("id")
      on update cascade;
    `);

    this.addSql(`
      alter table "baixas_pagamento"
      add constraint "baixas_pagamento_conta_bancaria_id_foreign"
      foreign key ("conta_bancaria_id")
      references "contas_bancarias" ("id")
      on update cascade;
    `);

    // Adiciona índices
    this.addSql(
      `create index "baixas_pagamento_conta_pagar_id_index" on "baixas_pagamento" ("conta_pagar_id");`,
    );
    this.addSql(
      `create index "baixas_pagamento_conta_bancaria_id_index" on "baixas_pagamento" ("conta_bancaria_id");`,
    );
    this.addSql(
      `create index "baixas_pagamento_data_index" on "baixas_pagamento" ("data");`,
    );
    this.addSql(
      `create index "baixas_pagamento_deletado_em_index" on "baixas_pagamento" ("deletado_em");`,
    );
  }

  override async down(): Promise<void> {
    // Remove foreign keys
    this.addSql(
      `alter table "baixas_pagamento" drop constraint "baixas_pagamento_conta_pagar_id_foreign";`,
    );
    this.addSql(
      `alter table "baixas_pagamento" drop constraint "baixas_pagamento_conta_bancaria_id_foreign";`,
    );

    // Remove tabela
    this.addSql(`drop table if exists "baixas_pagamento" cascade;`);
  }
}
