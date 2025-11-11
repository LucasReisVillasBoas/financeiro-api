import { Migration } from '@mikro-orm/migrations';

export class Migration20251110220000 extends Migration {
  override async up(): Promise<void> {
    // Criar enum para tipo_pessoa
    this.addSql(`
      CREATE TYPE tipo_pessoa_enum AS ENUM (
        'cliente',
        'fornecedor',
        'funcionario',
        'transportadora',
        'medico',
        'convenio',
        'hospital'
      );
    `);

    // Criar enum para situacao
    this.addSql(`
      CREATE TYPE situacao_pessoa_enum AS ENUM (
        'ativo',
        'inativo',
        'bloqueado',
        'pendente'
      );
    `);

    // Criar tabela pessoa_tipo (many-to-many para múltiplos tipos)
    this.addSql(`
      CREATE TABLE "pessoa_tipo" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "pessoa_id" uuid NOT NULL,
        "tipo" tipo_pessoa_enum NOT NULL,
        "criado_em" timestamptz NOT NULL,
        CONSTRAINT "pessoa_tipo_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "pessoa_tipo_unique" UNIQUE ("pessoa_id", "tipo")
      );
    `);

    // Adicionar índices
    this.addSql(`
      CREATE INDEX "pessoa_tipo_pessoa_id_index" ON "pessoa_tipo" ("pessoa_id");
    `);
    this.addSql(`
      CREATE INDEX "pessoa_tipo_tipo_index" ON "pessoa_tipo" ("tipo");
    `);

    // Adicionar campos faltantes na tabela pessoa
    this.addSql(`
      ALTER TABLE "pessoa"
      ADD COLUMN "cliente_id" varchar(255) NULL,
      ADD COLUMN "filial_id" uuid NULL,
      ADD COLUMN "situacao" situacao_pessoa_enum NOT NULL DEFAULT 'ativo';
    `);

    // Adicionar índices
    this.addSql(`
      CREATE INDEX "pessoa_cliente_id_index" ON "pessoa" ("cliente_id");
    `);
    this.addSql(`
      CREATE INDEX "pessoa_filial_id_index" ON "pessoa" ("filial_id");
    `);
    this.addSql(`
      CREATE INDEX "pessoa_situacao_index" ON "pessoa" ("situacao");
    `);

    // Adicionar foreign keys
    this.addSql(`
      ALTER TABLE "pessoa_tipo"
      ADD CONSTRAINT "pessoa_tipo_pessoa_id_foreign"
      FOREIGN KEY ("pessoa_id") REFERENCES "pessoa" ("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    this.addSql(`
      ALTER TABLE "pessoa"
      ADD CONSTRAINT "pessoa_filial_id_foreign"
      FOREIGN KEY ("filial_id") REFERENCES "empresa" ("id")
      ON UPDATE CASCADE ON DELETE SET NULL;
    `);

    // Migrar dados existentes: todas as pessoas ativas ficam com situacao 'ativo'
    this.addSql(`
      UPDATE "pessoa"
      SET "situacao" = CASE
        WHEN "ativo" = true THEN 'ativo'::situacao_pessoa_enum
        ELSE 'inativo'::situacao_pessoa_enum
      END;
    `);
  }

  override async down(): Promise<void> {
    // Remover foreign keys
    this.addSql(`
      ALTER TABLE "pessoa_tipo"
      DROP CONSTRAINT "pessoa_tipo_pessoa_id_foreign";
    `);

    this.addSql(`
      ALTER TABLE "pessoa"
      DROP CONSTRAINT "pessoa_filial_id_foreign";
    `);

    // Remover índices
    this.addSql(`DROP INDEX IF EXISTS "pessoa_tipo_pessoa_id_index";`);
    this.addSql(`DROP INDEX IF EXISTS "pessoa_tipo_tipo_index";`);
    this.addSql(`DROP INDEX IF EXISTS "pessoa_cliente_id_index";`);
    this.addSql(`DROP INDEX IF EXISTS "pessoa_filial_id_index";`);
    this.addSql(`DROP INDEX IF EXISTS "pessoa_situacao_index";`);

    // Remover tabela pessoa_tipo
    this.addSql(`DROP TABLE IF EXISTS "pessoa_tipo" CASCADE;`);

    // Remover colunas da tabela pessoa
    this.addSql(`
      ALTER TABLE "pessoa"
      DROP COLUMN "cliente_id",
      DROP COLUMN "filial_id",
      DROP COLUMN "situacao";
    `);

    // Remover enums
    this.addSql(`DROP TYPE IF EXISTS tipo_pessoa_enum;`);
    this.addSql(`DROP TYPE IF EXISTS situacao_pessoa_enum;`);
  }
}
