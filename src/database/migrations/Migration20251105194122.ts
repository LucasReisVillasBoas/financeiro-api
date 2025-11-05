import { Migration } from '@mikro-orm/migrations';

export class Migration20251105194122 extends Migration {

  override async up(): Promise<void> {
    // Migra dados da tabela duplicada "baixa_pagamento" para "baixas_pagamento"
    this.addSql(`
      INSERT INTO "baixas_pagamento" (
        id, conta_pagar_id, conta_bancaria_id, data, valor, acrescimos, descontos,
        total, tipo, observacao, movimentacao_bancaria_id, saldo_anterior,
        saldo_posterior, criado_em, atualizado_em, deletado_em, criado_por_id
      )
      SELECT
        id, conta_pagar_id, conta_bancaria_id, data, valor, acrescimos, descontos,
        total, tipo, observacao, movimentacao_bancaria_id, saldo_anterior,
        saldo_posterior, criado_em, atualizado_em, deletado_em, criado_por_id
      FROM "baixa_pagamento"
      WHERE NOT EXISTS (
        SELECT 1 FROM "baixas_pagamento" bp WHERE bp.id = "baixa_pagamento".id
      );
    `);

    // Remove tabela duplicada
    this.addSql(`drop table if exists "baixa_pagamento" cascade;`);
  }

  override async down(): Promise<void> {
    // Recria tabela baixa_pagamento (rollback - apenas para casos de emergência)
    this.addSql(`create table "baixa_pagamento" ("id" uuid not null default gen_random_uuid(), "conta_pagar_id" uuid not null, "conta_bancaria_id" uuid not null, "data" date not null, "valor" numeric(15,2) not null, "acrescimos" numeric(15,2) not null default 0, "descontos" numeric(15,2) not null default 0, "total" numeric(15,2) not null, "tipo" varchar(10) not null, "observacao" text null, "movimentacao_bancaria_id" uuid null, "saldo_anterior" numeric(15,2) not null, "saldo_posterior" numeric(15,2) not null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, "criado_por_id" uuid null, constraint "baixa_pagamento_pkey" primary key ("id"));`);

    this.addSql(`alter table "baixa_pagamento" add constraint "baixa_pagamento_conta_pagar_id_foreign" foreign key ("conta_pagar_id") references "contas_pagar" ("id") on update cascade;`);
    this.addSql(`alter table "baixa_pagamento" add constraint "baixa_pagamento_conta_bancaria_id_foreign" foreign key ("conta_bancaria_id") references "contas_bancarias" ("id") on update cascade;`);

    // Migra dados de volta
    this.addSql(`
      INSERT INTO "baixa_pagamento" SELECT * FROM "baixas_pagamento"
      WHERE NOT EXISTS (SELECT 1 FROM "baixa_pagamento" bp WHERE bp.id = "baixas_pagamento".id);
    `);
  }

}
