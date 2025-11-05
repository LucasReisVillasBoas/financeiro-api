import { Migration } from '@mikro-orm/migrations';

export class Migration20251103235604_criar_tabela_baixas_pagamento extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "contas_pagar" add column "movimentacao_bancaria_id" uuid null, add column "cancelado_em" timestamptz null, add column "justificativa_cancelamento" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "contas_pagar" drop column "movimentacao_bancaria_id", drop column "cancelado_em", drop column "justificativa_cancelamento";`);
  }

}
