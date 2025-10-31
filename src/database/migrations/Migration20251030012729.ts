import { Migration } from '@mikro-orm/migrations';

export class Migration20251030012729 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table "auditoria" (
        "id" uuid not null default gen_random_uuid(),
        "usuario_id" uuid null,
        "acao" varchar(50) not null,
        "modulo" varchar(100) not null,
        "empresa_id" uuid null,
        "filial_id" uuid null,
        "cliente_id" uuid null,
        "data_hora" timestamp not null default now(),
        "resultado" varchar(20) not null check ("resultado" in ('SUCESSO', 'FALHA', 'NEGADO')),
        "ip_address" varchar(45) null,
        "user_agent" text null,
        "detalhes" jsonb null,
        "mensagem_erro" text null,
        constraint "auditoria_pkey" primary key ("id")
      );
    `);

    this.addSql(`create index "auditoria_usuario_id_data_hora_index" on "auditoria" ("usuario_id", "data_hora");`);
    this.addSql(`create index "auditoria_modulo_data_hora_index" on "auditoria" ("modulo", "data_hora");`);
    this.addSql(`create index "auditoria_empresa_id_data_hora_index" on "auditoria" ("empresa_id", "data_hora");`);
    this.addSql(`create index "auditoria_cliente_id_data_hora_index" on "auditoria" ("cliente_id", "data_hora");`);
    this.addSql(`create index "auditoria_acao_data_hora_index" on "auditoria" ("acao", "data_hora");`);
    this.addSql(`create index "auditoria_usuario_id_index" on "auditoria" ("usuario_id");`);
    this.addSql(`create index "auditoria_empresa_id_index" on "auditoria" ("empresa_id");`);
    this.addSql(`create index "auditoria_filial_id_index" on "auditoria" ("filial_id");`);
    this.addSql(`create index "auditoria_cliente_id_index" on "auditoria" ("cliente_id");`);
    this.addSql(`create index "auditoria_data_hora_index" on "auditoria" ("data_hora");`);

    this.addSql(`
      alter table "auditoria"
      add constraint "auditoria_usuario_id_foreign"
      foreign key ("usuario_id")
      references "usuario" ("id")
      on update cascade on delete set null;
    `);

    this.addSql(`
      alter table "auditoria"
      add constraint "auditoria_empresa_id_foreign"
      foreign key ("empresa_id")
      references "empresa" ("id")
      on update cascade on delete set null;
    `);

    this.addSql(`
      alter table "auditoria"
      add constraint "auditoria_filial_id_foreign"
      foreign key ("filial_id")
      references "empresa" ("id")
      on update cascade on delete set null;
    `);

    this.addSql(`
      create or replace function prevent_auditoria_modification()
      returns trigger as $$
      begin
        raise exception 'Registros de auditoria são imutáveis e não podem ser alterados ou excluídos';
        return null;
      end;
      $$ language plpgsql;
    `);

    this.addSql(`
      create trigger prevent_auditoria_update
      before update on "auditoria"
      for each row execute function prevent_auditoria_modification();
    `);

    this.addSql(`
      create trigger prevent_auditoria_delete
      before delete on "auditoria"
      for each row execute function prevent_auditoria_modification();
    `);

  }

  override async down(): Promise<void> {
    this.addSql(`drop trigger if exists prevent_auditoria_update on "auditoria";`);
    this.addSql(`drop trigger if exists prevent_auditoria_delete on "auditoria";`);
    this.addSql(`drop function if exists prevent_auditoria_modification();`);

    this.addSql(`drop table if exists "auditoria" cascade;`);
  }

}
