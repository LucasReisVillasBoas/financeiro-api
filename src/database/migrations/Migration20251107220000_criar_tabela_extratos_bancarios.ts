import { Migration } from '@mikro-orm/migrations';

export class Migration20251107220000_criar_tabela_extratos_bancarios extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "extratos_bancarios" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "conta_bancaria_id" uuid NOT NULL,
        "data_transacao" date NOT NULL,
        "descricao" varchar(500) NOT NULL,
        "documento" varchar(255),
        "valor" decimal(15,2) NOT NULL,
        "tipo_transacao" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pendente',
        "movimentacao_sugerida_id" uuid,
        "movimentacao_conciliada_id" uuid,
        "score_match" decimal(5,2),
        "observacao" text,
        "formato_origem" varchar(50) NOT NULL,
        "nome_arquivo" varchar(100) NOT NULL,
        "empresa_id" uuid,
        "importado_por" uuid,
        "criado_em" timestamptz NOT NULL DEFAULT now(),
        "atualizado_em" timestamptz NOT NULL DEFAULT now(),
        "deletado_em" timestamptz,
        CONSTRAINT "fk_extrato_conta_bancaria" FOREIGN KEY ("conta_bancaria_id")
          REFERENCES "contas_bancarias"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_extrato_movimentacao_sugerida" FOREIGN KEY ("movimentacao_sugerida_id")
          REFERENCES "movimentacoes_bancarias"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_extrato_movimentacao_conciliada" FOREIGN KEY ("movimentacao_conciliada_id")
          REFERENCES "movimentacoes_bancarias"("id") ON DELETE SET NULL
      );
    `);

    this.addSql(`
      CREATE INDEX "idx_extrato_conta_data"
        ON "extratos_bancarios"("conta_bancaria_id", "data_transacao");
    `);

    this.addSql(`
      CREATE INDEX "idx_extrato_status"
        ON "extratos_bancarios"("status");
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "extratos_bancarios" CASCADE;`);
  }
}
