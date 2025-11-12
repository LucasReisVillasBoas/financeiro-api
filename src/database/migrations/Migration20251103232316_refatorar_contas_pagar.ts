import { Migration } from '@mikro-orm/migrations';

export class Migration20251103232316_refatorar_contas_pagar extends Migration {
  override async up(): Promise<void> {
    // IMPORTANTE: Esta migration requer dados limpos ou migração manual dos dados existentes
    // Para ambientes com dados de produção, ajuste conforme necessário

    // Delete existing records (se você estiver em desenvolvimento e puder perder os dados)
    // Comente esta linha se precisar manter os dados
    this.addSql(`DELETE FROM "contas_pagar";`);

    this.addSql(
      `alter table "contas_pagar" drop constraint "contas_pagar_plano_contas_id_foreign";`,
    );

    // Rename columns first (antes de adicionar novos campos)
    this.addSql(
      `alter table "contas_pagar" rename column "data_pagamento" to "data_liquidacao";`,
    );
    this.addSql(
      `alter table "contas_pagar" rename column "valor" to "valor_principal";`,
    );

    // Add new columns as NULLABLE first
    this.addSql(
      `alter table "contas_pagar" add column "documento" varchar(100) null;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "serie" varchar(20) null;`,
    );
    this.addSql(`alter table "contas_pagar" add column "parcela" int null;`);
    this.addSql(
      `alter table "contas_pagar" add column "tipo" varchar(50) null;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "data_emissao" date null;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "data_lancamento" date null;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "acrescimos" numeric(15,2) default 0;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "descontos" numeric(15,2) default 0;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "valor_total" numeric(15,2) null;`,
    );
    this.addSql(
      `alter table "contas_pagar" add column "saldo" numeric(15,2) null;`,
    );
    this.addSql(`alter table "contas_pagar" add column "pessoa_id" uuid null;`);

    // Update existing records with default values (using fornecedor as documento)
    this.addSql(`
      UPDATE "contas_pagar"
      SET
        "documento" = COALESCE("fornecedor", 'SEM-DOC-' || id::text),
        "parcela" = 1,
        "tipo" = 'Nota Fiscal',
        "data_emissao" = COALESCE("vencimento", CURRENT_DATE),
        "data_lancamento" = COALESCE("vencimento", CURRENT_DATE),
        "acrescimos" = 0,
        "descontos" = 0,
        "valor_total" = "valor_principal",
        "saldo" = "valor_principal"
      WHERE "documento" IS NULL;
    `);

    // Only update pessoa_id if there are pessoas in the database
    this.addSql(`
      UPDATE "contas_pagar" cp
      SET "pessoa_id" = (SELECT id FROM pessoa LIMIT 1)
      WHERE cp."pessoa_id" IS NULL
        AND EXISTS (SELECT 1 FROM pessoa LIMIT 1);
    `);

    // Now make columns NOT NULL (after data is populated)
    this.addSql(
      `alter table "contas_pagar" alter column "documento" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "parcela" set not null;`,
    );
    this.addSql(`alter table "contas_pagar" alter column "tipo" set not null;`);
    this.addSql(
      `alter table "contas_pagar" alter column "data_emissao" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "data_lancamento" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "acrescimos" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "descontos" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "valor_total" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "saldo" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "pessoa_id" set not null;`,
    );

    // Drop fornecedor column (after data migration)
    this.addSql(`alter table "contas_pagar" drop column "fornecedor";`);

    // Update other columns
    this.addSql(
      `alter table "contas_pagar" alter column "status" type varchar(50) using ("status"::varchar(50));`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "status" set default 'Pendente';`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" drop default;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" set not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" drop default;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" type uuid using ("plano_contas_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" set not null;`,
    );

    // Add foreign keys
    this.addSql(
      `alter table "contas_pagar" add constraint "contas_pagar_pessoa_id_foreign" foreign key ("pessoa_id") references "pessoa" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "contas_pagar" add constraint "contas_pagar_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "contas_pagar" add constraint "contas_pagar_plano_contas_id_foreign" foreign key ("plano_contas_id") references "plano_contas" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "contas_pagar" drop constraint "contas_pagar_pessoa_id_foreign";`,
    );
    this.addSql(
      `alter table "contas_pagar" drop constraint "contas_pagar_empresa_id_foreign";`,
    );
    this.addSql(
      `alter table "contas_pagar" drop constraint "contas_pagar_plano_contas_id_foreign";`,
    );

    this.addSql(
      `alter table "contas_pagar" drop column "documento", drop column "serie", drop column "parcela", drop column "tipo", drop column "data_emissao", drop column "data_lancamento", drop column "acrescimos", drop column "descontos", drop column "valor_total", drop column "saldo", drop column "pessoa_id";`,
    );

    this.addSql(
      `alter table "contas_pagar" add column "fornecedor" varchar(255) not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "status" drop default;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "status" type varchar(50) using ("status"::varchar(50));`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" drop default;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" type uuid using ("plano_contas_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "plano_contas_id" drop not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" drop default;`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`,
    );
    this.addSql(
      `alter table "contas_pagar" alter column "empresa_id" drop not null;`,
    );
    this.addSql(
      `alter table "contas_pagar" rename column "valor_principal" to "valor";`,
    );
    this.addSql(
      `alter table "contas_pagar" rename column "data_liquidacao" to "data_pagamento";`,
    );
    this.addSql(
      `alter table "contas_pagar" add constraint "contas_pagar_plano_contas_id_foreign" foreign key ("plano_contas_id") references "plano_contas" ("id") on update cascade on delete set null;`,
    );
  }
}
