import { Migration } from '@mikro-orm/migrations';

export class Migration20251110223000 extends Migration {
  override async up(): Promise<void> {
    // Criar enum para tipo_contribuinte (conforme tabela SEFAZ)
    this.addSql(`
      CREATE TYPE tipo_contribuinte_enum AS ENUM (
        '1',  -- Contribuinte ICMS
        '2',  -- Contribuinte isento
        '9'   -- Não contribuinte
      );
    `);

    // Adicionar campos fiscais faltantes na tabela pessoa
    this.addSql(`
      ALTER TABLE "pessoa"
      ADD COLUMN "im" varchar(20) NULL,
      ADD COLUMN "tipo_contribuinte" tipo_contribuinte_enum NULL,
      ADD COLUMN "consumidor_final" boolean NOT NULL DEFAULT true;
    `);

    // Adicionar índice para tipo_contribuinte (útil para queries fiscais)
    this.addSql(`
      CREATE INDEX "pessoa_tipo_contribuinte_index" ON "pessoa" ("tipo_contribuinte");
    `);

    // Adicionar comentários para documentação
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."im" IS 'Inscrição Municipal';
    `);
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."tipo_contribuinte" IS 'Tipo de contribuinte conforme tabela SEFAZ (1=Contribuinte ICMS, 2=Isento, 9=Não Contribuinte)';
    `);
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."consumidor_final" IS 'Indica se a pessoa é consumidor final (S/N)';
    `);
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."documento" IS 'CNPJ ou CPF (apenas números)';
    `);
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."ie_rg" IS 'Inscrição Estadual ou RG';
    `);
  }

  override async down(): Promise<void> {
    // Remover índice
    this.addSql(`DROP INDEX IF EXISTS "pessoa_tipo_contribuinte_index";`);

    // Remover comentários
    this.addSql(`COMMENT ON COLUMN "pessoa"."im" IS NULL;`);
    this.addSql(`COMMENT ON COLUMN "pessoa"."tipo_contribuinte" IS NULL;`);
    this.addSql(`COMMENT ON COLUMN "pessoa"."consumidor_final" IS NULL;`);
    this.addSql(`COMMENT ON COLUMN "pessoa"."documento" IS NULL;`);
    this.addSql(`COMMENT ON COLUMN "pessoa"."ie_rg" IS NULL;`);

    // Remover colunas
    this.addSql(`
      ALTER TABLE "pessoa"
      DROP COLUMN "im",
      DROP COLUMN "tipo_contribuinte",
      DROP COLUMN "consumidor_final";
    `);

    // Remover enum
    this.addSql(`DROP TYPE IF EXISTS tipo_contribuinte_enum;`);
  }
}
