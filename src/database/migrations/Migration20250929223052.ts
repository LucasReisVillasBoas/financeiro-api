import { Migration } from '@mikro-orm/migrations';

export class Migration20250929223052 extends Migration {
  override async up(): Promise<void> {
    // Remover índices e foreign keys antigas
    this.addSql('drop index if exists "contato_entity_type_index";');
    this.addSql('drop index if exists "contato_entity_id_index";');
    this.addSql(
      'alter table "contato" drop constraint if exists "contato_tipo_contato_id_foreign";',
    );

    // Remover colunas antigas e adicionar novas
    this.addSql('alter table "contato" drop column if exists "entity_type";');
    this.addSql('alter table "contato" drop column if exists "entity_id";');
    this.addSql(
      'alter table "contato" drop column if exists "tipo_contato_id";',
    );
    this.addSql('alter table "contato" drop column if exists "criado_em";');
    this.addSql('alter table "contato" drop column if exists "atualizado_em";');
    this.addSql('alter table "contato" drop column if exists "deletado_em";');
    this.addSql('alter table "contato" drop column if exists "descricao";');
    this.addSql('alter table "contato" drop column if exists "ativo";');

    // Adicionar novas colunas
    this.addSql('alter table "contato" add column "cliente_id" uuid not null;');
    this.addSql('alter table "contato" add column "filial_id" uuid null;');
    this.addSql(
      'alter table "contato" add column "nome" varchar(100) not null;',
    );
    this.addSql(
      'alter table "contato" add column "funcao" varchar(100) not null;',
    );
    this.addSql(
      'alter table "contato" add column "telefone" varchar(15) not null;',
    );
    this.addSql(
      'alter table "contato" add column "celular" varchar(15) not null;',
    );
    this.addSql(
      'alter table "contato" add column "email" varchar(100) not null;',
    );
    this.addSql(
      'alter table "contato" add column "criado_em" timestamptz not null default now();',
    );
    this.addSql(
      'alter table "contato" add column "atualizado_em" timestamptz not null default now();',
    );

    this.addSql(
      'alter table "contato" add column "deletado_em" timestamptz null;',
    );

    // Adicionar foreign keys
    this.addSql(
      'alter table "contato" add constraint "contato_cliente_id_foreign" foreign key ("cliente_id") references "usuario" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "contato" add constraint "contato_filial_id_foreign" foreign key ("filial_id") references "empresa" ("id") on update cascade on delete set null;',
    );
  }

  override async down(): Promise<void> {
    // Reverter as mudanças
    this.addSql(
      'alter table "contato" drop constraint if exists "contato_cliente_id_foreign";',
    );
    this.addSql(
      'alter table "contato" drop constraint if exists "contato_filial_id_foreign";',
    );

    this.addSql('alter table "contato" drop column if exists "cliente_id";');
    this.addSql('alter table "contato" drop column if exists "filial_id";');
    this.addSql('alter table "contato" drop column if exists "nome";');
    this.addSql('alter table "contato" drop column if exists "funcao";');
    this.addSql('alter table "contato" drop column if exists "telefone";');
    this.addSql('alter table "contato" drop column if exists "celular";');
    this.addSql('alter table "contato" drop column if exists "email";');

    // Restaurar colunas antigas (opcional - você pode ajustar conforme necessário)
    this.addSql('alter table "contato" add column "entity_type" varchar(100);');
    this.addSql('alter table "contato" add column "entity_id" uuid;');
    this.addSql('alter table "contato" add column "tipo_contato_id" uuid;');

    this.addSql(
      'create index "contato_entity_type_index" on "contato" ("entity_type");',
    );
    this.addSql(
      'create index "contato_entity_id_index" on "contato" ("entity_id");',
    );
  }
}
