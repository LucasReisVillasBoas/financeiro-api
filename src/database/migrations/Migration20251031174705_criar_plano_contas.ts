import { Migration } from '@mikro-orm/migrations';

export class Migration20251031174705_criar_plano_contas extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "plano_contas" ("id" uuid not null default gen_random_uuid(), "empresa_id" uuid not null, "codigo" varchar(50) not null, "descricao" varchar(255) not null, "tipo" varchar(50) not null, "parent_id" uuid null, "nivel" int not null, "permite_lancamento" boolean not null default true, "ativo" boolean not null default true, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deletado_em" timestamptz null, constraint "plano_contas_pkey" primary key ("id"));`);

    this.addSql(`create index "plano_contas_empresa_id_index" on "plano_contas" ("empresa_id");`);
    this.addSql(`create index "plano_contas_codigo_index" on "plano_contas" ("codigo");`);
    this.addSql(`create index "plano_contas_tipo_index" on "plano_contas" ("tipo");`);
    this.addSql(`create index "plano_contas_parent_id_index" on "plano_contas" ("parent_id");`);

    this.addSql(`create index "plano_contas_empresa_id_codigo_index" on "plano_contas" ("empresa_id", "codigo");`);
    this.addSql(`alter table "plano_contas" add constraint "plano_contas_empresa_id_codigo_unique" unique ("empresa_id", "codigo");`);

    this.addSql(`alter table "plano_contas" add constraint "plano_contas_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "plano_contas" add constraint "plano_contas_parent_id_foreign" foreign key ("parent_id") references "plano_contas" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "plano_contas" drop constraint "plano_contas_parent_id_foreign";`);

    this.addSql(`drop table if exists "plano_contas" cascade;`);
  }

}
