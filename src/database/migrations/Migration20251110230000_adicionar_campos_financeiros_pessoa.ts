import { Migration } from '@mikro-orm/migrations';

export class Migration20251110230000 extends Migration {
  override async up(): Promise<void> {
    // Criar enum para situacao_financeira
    this.addSql(`
      CREATE TYPE situacao_financeira_enum AS ENUM (
        'ativo',
        'inativo',
        'bloqueado',
        'suspenso'
      );
    `);

    // Adicionar campos financeiros na tabela pessoa
    this.addSql(`
      ALTER TABLE "pessoa"
      ADD COLUMN "limite_credito" numeric(15,2) NULL DEFAULT 0.00,
      ADD COLUMN "situacao_financeira" situacao_financeira_enum NOT NULL DEFAULT 'ativo';
    `);

    // Adicionar índice para situacao_financeira (útil para queries financeiras)
    this.addSql(`
      CREATE INDEX "pessoa_situacao_financeira_index" ON "pessoa" ("situacao_financeira");
    `);

    // Adicionar índice composto para multi-tenancy + situacao_financeira
    // (útil para queries como "buscar pessoas ativas financeiramente de uma empresa")
    this.addSql(`
      CREATE INDEX "pessoa_empresa_situacao_financeira_index"
      ON "pessoa" ("empresa_id", "situacao_financeira");
    `);

    // Adicionar comentários para documentação
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."limite_credito" IS 'Limite de crédito disponível para a pessoa (em reais)';
    `);
    this.addSql(`
      COMMENT ON COLUMN "pessoa"."situacao_financeira" IS 'Situação financeira da pessoa (ativo, inativo, bloqueado, suspenso)';
    `);

    // Atualizar registros existentes com situação financeira baseada na situação geral
    this.addSql(`
      UPDATE "pessoa"
      SET "situacao_financeira" = CASE
        WHEN "situacao" = 'ativo' THEN 'ativo'::situacao_financeira_enum
        WHEN "situacao" = 'bloqueado' THEN 'bloqueado'::situacao_financeira_enum
        ELSE 'inativo'::situacao_financeira_enum
      END;
    `);
  }

  override async down(): Promise<void> {
    // Remover índices
    this.addSql(`DROP INDEX IF EXISTS "pessoa_situacao_financeira_index";`);
    this.addSql(`DROP INDEX IF EXISTS "pessoa_empresa_situacao_financeira_index";`);

    // Remover comentários
    this.addSql(`COMMENT ON COLUMN "pessoa"."limite_credito" IS NULL;`);
    this.addSql(`COMMENT ON COLUMN "pessoa"."situacao_financeira" IS NULL;`);

    // Remover colunas
    this.addSql(`
      ALTER TABLE "pessoa"
      DROP COLUMN "limite_credito",
      DROP COLUMN "situacao_financeira";
    `);

    // Remover enum
    this.addSql(`DROP TYPE IF EXISTS situacao_financeira_enum;`);
  }
}
