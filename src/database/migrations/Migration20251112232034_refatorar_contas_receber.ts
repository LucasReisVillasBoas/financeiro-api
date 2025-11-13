import { Migration } from '@mikro-orm/migrations';

export class Migration20251112232034_refatorar_contas_receber extends Migration {

  override async up(): Promise<void> {
    // 1. Remove a coluna antiga 'cliente' (string) - mas vamos guardar temporariamente
    // Não vamos dropar ainda, vamos usar para popular pessoa_id

    // 2. Remove a coluna antiga 'valor' (será substituída por campos detalhados)
    // Vamos guardar também para popular valor_principal

    // 3. Remove data_recebimento (será substituída por data_liquidacao)
    // Também vamos guardar

    // 4. Adiciona vínculo com Pessoa (nullable inicialmente)
    this.addSql(`alter table "contas_receber" add column "pessoa_id" uuid null;`);
    this.addSql(
      `alter table "contas_receber" add constraint "contas_receber_pessoa_id_foreign" foreign key ("pessoa_id") references "pessoa" ("id") on update cascade on delete restrict;`,
    );
    this.addSql(`create index "contas_receber_pessoa_id_index" on "contas_receber" ("pessoa_id");`);

    // 5. Adiciona campos obrigatórios de documento (com valores padrão temporários)
    this.addSql(`alter table "contas_receber" add column "documento" varchar(50) null;`);
    this.addSql(`alter table "contas_receber" add column "serie" varchar(10) null;`);
    this.addSql(`alter table "contas_receber" add column "parcela" int not null default 1;`);
    this.addSql(`alter table "contas_receber" add column "tipo" varchar(50) not null default 'BOLETO';`);

    // 6. Adiciona campos de datas (nullable inicialmente)
    this.addSql(`alter table "contas_receber" add column "data_emissao" date null;`);
    this.addSql(`alter table "contas_receber" add column "data_lancamento" date null;`);
    this.addSql(`alter table "contas_receber" add column "data_liquidacao" date null;`);

    // 7. Adiciona campos monetários detalhados (nullable inicialmente)
    this.addSql(`alter table "contas_receber" add column "valor_principal" numeric(15,2) null;`);
    this.addSql(`alter table "contas_receber" add column "valor_acrescimos" numeric(15,2) not null default 0;`);
    this.addSql(`alter table "contas_receber" add column "valor_descontos" numeric(15,2) not null default 0;`);
    this.addSql(`alter table "contas_receber" add column "valor_total" numeric(15,2) null;`);
    this.addSql(`alter table "contas_receber" add column "saldo" numeric(15,2) null;`);

    // 8. Popula os novos campos com dados dos campos antigos
    // - Pega a primeira pessoa disponível como padrão
    this.addSql(`
      UPDATE "contas_receber"
      SET "pessoa_id" = (SELECT id FROM "pessoa" LIMIT 1)
      WHERE "pessoa_id" IS NULL;
    `);

    // - Copia valor para valor_principal e valor_total
    this.addSql(`UPDATE "contas_receber" SET "valor_principal" = "valor" WHERE "valor_principal" IS NULL;`);
    this.addSql(`UPDATE "contas_receber" SET "valor_total" = "valor" WHERE "valor_total" IS NULL;`);
    this.addSql(`UPDATE "contas_receber" SET "saldo" = "valor" WHERE "saldo" IS NULL;`);

    // - Usa vencimento como data_emissao e data_lancamento padrão
    this.addSql(`UPDATE "contas_receber" SET "data_emissao" = "vencimento" WHERE "data_emissao" IS NULL;`);
    this.addSql(`UPDATE "contas_receber" SET "data_lancamento" = "vencimento" WHERE "data_lancamento" IS NULL;`);

    // - Copia data_recebimento para data_liquidacao
    this.addSql(`UPDATE "contas_receber" SET "data_liquidacao" = "data_recebimento" WHERE "data_recebimento" IS NOT NULL;`);

    // - Gera um documento padrão baseado no id
    this.addSql(`UPDATE "contas_receber" SET "documento" = CONCAT('DOC-', SUBSTRING(id::text, 1, 8)) WHERE "documento" IS NULL;`);

    // 9. Torna os campos obrigatórios NOT NULL
    this.addSql(`alter table "contas_receber" alter column "pessoa_id" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "documento" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "data_emissao" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "data_lancamento" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "valor_principal" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "valor_total" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "saldo" set not null;`);

    // 10. Torna plano_contas_id obrigatório (se houver registros sem plano_contas, atribui o primeiro)
    this.addSql(`
      UPDATE "contas_receber"
      SET "plano_contas_id" = (SELECT id FROM "plano_contas" LIMIT 1)
      WHERE "plano_contas_id" IS NULL;
    `);
    this.addSql(`alter table "contas_receber" alter column "plano_contas_id" set not null;`);

    // 11. Remove os campos antigos
    this.addSql(`alter table "contas_receber" drop column "data_recebimento";`);
    this.addSql(`alter table "contas_receber" drop column "valor";`);
    this.addSql(`alter table "contas_receber" drop column "cliente";`);

    // 12. Adiciona constraints de validação para valores >= 0
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_valor_principal_check" check ("valor_principal" >= 0);`);
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_valor_acrescimos_check" check ("valor_acrescimos" >= 0);`);
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_valor_descontos_check" check ("valor_descontos" >= 0);`);
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_valor_total_check" check ("valor_total" >= 0);`);
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_saldo_check" check ("saldo" >= 0);`);

    // 13. Adiciona constraint de validação para datas (emissao <= vencimento)
    this.addSql(`alter table "contas_receber" add constraint "contas_receber_datas_validas_check" check ("data_emissao" <= "vencimento");`);
  }

  override async down(): Promise<void> {
    // Remove constraints
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_datas_validas_check";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_saldo_check";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_valor_total_check";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_valor_descontos_check";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_valor_acrescimos_check";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_valor_principal_check";`);

    // Restaura campos antigos
    this.addSql(`alter table "contas_receber" add column "cliente" varchar(255) null;`);
    this.addSql(`alter table "contas_receber" add column "valor" numeric(15,2) null;`);
    this.addSql(`alter table "contas_receber" add column "data_recebimento" date null;`);

    // Copia dados de volta
    this.addSql(`UPDATE "contas_receber" SET "valor" = "valor_principal" WHERE "valor" IS NULL;`);
    this.addSql(`UPDATE "contas_receber" SET "data_recebimento" = "data_liquidacao" WHERE "data_liquidacao" IS NOT NULL;`);
    this.addSql(`UPDATE "contas_receber" SET "cliente" = 'Cliente não identificado' WHERE "cliente" IS NULL;`);

    // Torna campos antigos obrigatórios
    this.addSql(`alter table "contas_receber" alter column "valor" set not null;`);
    this.addSql(`alter table "contas_receber" alter column "cliente" set not null;`);

    // Remove novos campos monetários
    this.addSql(`alter table "contas_receber" drop column "saldo";`);
    this.addSql(`alter table "contas_receber" drop column "valor_total";`);
    this.addSql(`alter table "contas_receber" drop column "valor_descontos";`);
    this.addSql(`alter table "contas_receber" drop column "valor_acrescimos";`);
    this.addSql(`alter table "contas_receber" drop column "valor_principal";`);

    // Remove campos de datas
    this.addSql(`alter table "contas_receber" drop column "data_liquidacao";`);
    this.addSql(`alter table "contas_receber" drop column "data_lancamento";`);
    this.addSql(`alter table "contas_receber" drop column "data_emissao";`);

    // Remove campos de documento
    this.addSql(`alter table "contas_receber" drop column "tipo";`);
    this.addSql(`alter table "contas_receber" drop column "parcela";`);
    this.addSql(`alter table "contas_receber" drop column "serie";`);
    this.addSql(`alter table "contas_receber" drop column "documento";`);

    // Volta plano_contas_id para nullable
    this.addSql(`alter table "contas_receber" alter column "plano_contas_id" drop not null;`);

    // Remove foreign key de pessoa
    this.addSql(`drop index "contas_receber_pessoa_id_index";`);
    this.addSql(`alter table "contas_receber" drop constraint "contas_receber_pessoa_id_foreign";`);
    this.addSql(`alter table "contas_receber" drop column "pessoa_id";`);
  }

}
