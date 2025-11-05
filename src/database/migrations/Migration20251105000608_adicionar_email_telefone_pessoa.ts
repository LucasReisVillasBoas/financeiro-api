import { Migration } from '@mikro-orm/migrations';

export class Migration20251105000608_adicionar_email_telefone_pessoa extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "baixa_pagamento" ("id" uuid not null default gen_random_uuid(), "conta_pagar_id" uuid not null, "conta_bancaria_id" uuid not null, "data" date not null, "valor" numeric(15,2) not null, "acrescimos" numeric(15,2) not null default 0, "descontos" numeric(15,2) not null default 0, "total" numeric(15,2) not null, "tipo" varchar(10) not null, "observacao" text null, "movimentacao_bancaria_id" uuid null, "saldo_anterior" numeric(15,2) not null, "saldo_posterior" numeric(15,2) not null, "criado_em" timestamptz not null, "atualizado_em" timestamptz not null, "deletado_em" timestamptz null, "criado_por_id" uuid null, constraint "baixa_pagamento_pkey" primary key ("id"));`);

    this.addSql(`alter table "baixa_pagamento" add constraint "baixa_pagamento_conta_pagar_id_foreign" foreign key ("conta_pagar_id") references "contas_pagar" ("id") on update cascade;`);
    this.addSql(`alter table "baixa_pagamento" add constraint "baixa_pagamento_conta_bancaria_id_foreign" foreign key ("conta_bancaria_id") references "contas_bancarias" ("id") on update cascade;`);

    this.addSql(`alter table "pessoa" add column "email" varchar(100) null, add column "telefone" varchar(20) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "baixa_pagamento" cascade;`);

    this.addSql(`alter table "pessoa" drop column "email", drop column "telefone";`);
  }

}
