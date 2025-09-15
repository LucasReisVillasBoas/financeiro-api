import { Migration } from '@mikro-orm/migrations';

export class Migration20250811173403 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "empresa" drop constraint "empresa_matriz_id_foreign";`);
    this.addSql(`alter table "empresa" drop constraint "empresa_endereco_id_foreign";`);

    this.addSql(`alter table "contato" drop constraint "contato_tipo_contato_id_foreign";`);

    this.addSql(`alter table "pessoa" drop constraint "pessoa_empresa_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_endereco_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_criado_por_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_atualizado_por_id_foreign";`);

    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_empresa_id_foreign";`);
    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_usuario_id_foreign";`);

    this.addSql(`alter table "endereco" alter column "id" drop default;`);
    this.addSql(`alter table "endereco" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "endereco" alter column "id" set default gen_random_uuid();`);

    this.addSql(`alter table "empresa" alter column "id" drop default;`);
    this.addSql(`alter table "empresa" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "empresa" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "empresa" alter column "matriz_id" drop default;`);
    this.addSql(`alter table "empresa" alter column "matriz_id" type uuid using ("matriz_id"::text::uuid);`);
    this.addSql(`alter table "empresa" alter column "endereco_id" drop default;`);
    this.addSql(`alter table "empresa" alter column "endereco_id" type uuid using ("endereco_id"::text::uuid);`);
    this.addSql(`alter table "empresa" alter column "matriz_filial" type varchar(255) using ("matriz_filial"::varchar(255));`);
    this.addSql(`alter table "empresa" add constraint "empresa_matriz_id_foreign" foreign key ("matriz_id") references "empresa" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "empresa" add constraint "empresa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "tipo_contato" alter column "id" drop default;`);
    this.addSql(`alter table "tipo_contato" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "tipo_contato" alter column "id" set default gen_random_uuid();`);

    this.addSql(`alter table "contato" alter column "id" drop default;`);
    this.addSql(`alter table "contato" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "contato" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "contato" alter column "tipo_contato_id" drop default;`);
    this.addSql(`alter table "contato" alter column "tipo_contato_id" type uuid using ("tipo_contato_id"::text::uuid);`);
    this.addSql(`alter table "contato" add constraint "contato_tipo_contato_id_foreign" foreign key ("tipo_contato_id") references "tipo_contato" ("id") on update cascade;`);

    this.addSql(`alter table "usuario" alter column "id" drop default;`);
    this.addSql(`alter table "usuario" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "usuario" alter column "id" set default gen_random_uuid();`);

    this.addSql(`alter table "pessoa" alter column "id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "pessoa" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "pessoa" alter column "empresa_id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`);
    this.addSql(`alter table "pessoa" alter column "endereco_id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "endereco_id" type uuid using ("endereco_id"::text::uuid);`);
    this.addSql(`alter table "pessoa" alter column "criado_por_id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "criado_por_id" type uuid using ("criado_por_id"::text::uuid);`);
    this.addSql(`alter table "pessoa" alter column "atualizado_por_id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "atualizado_por_id" type uuid using ("atualizado_por_id"::text::uuid);`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_criado_por_id_foreign" foreign key ("criado_por_id") references "usuario" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_atualizado_por_id_foreign" foreign key ("atualizado_por_id") references "usuario" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "empresa_usuario" alter column "id" drop default;`);
    this.addSql(`alter table "empresa_usuario" alter column "id" type uuid using ("id"::text::uuid);`);
    this.addSql(`alter table "empresa_usuario" alter column "id" set default gen_random_uuid();`);
    this.addSql(`alter table "empresa_usuario" alter column "empresa_id" drop default;`);
    this.addSql(`alter table "empresa_usuario" alter column "empresa_id" type uuid using ("empresa_id"::text::uuid);`);
    this.addSql(`alter table "empresa_usuario" alter column "usuario_id" drop default;`);
    this.addSql(`alter table "empresa_usuario" alter column "usuario_id" type uuid using ("usuario_id"::text::uuid);`);
    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "endereco" alter column "id" type text using ("id"::text);`);

    this.addSql(`alter table "empresa" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table "empresa" alter column "matriz_id" type text using ("matriz_id"::text);`);
    this.addSql(`alter table "empresa" alter column "endereco_id" type text using ("endereco_id"::text);`);

    this.addSql(`alter table "empresa" drop constraint "empresa_matriz_id_foreign";`);
    this.addSql(`alter table "empresa" drop constraint "empresa_endereco_id_foreign";`);

    this.addSql(`alter table "tipo_contato" alter column "id" type text using ("id"::text);`);

    this.addSql(`alter table "contato" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table "contato" alter column "tipo_contato_id" type text using ("tipo_contato_id"::text);`);

    this.addSql(`alter table "contato" drop constraint "contato_tipo_contato_id_foreign";`);

    this.addSql(`alter table "usuario" alter column "id" type text using ("id"::text);`);

    this.addSql(`alter table "pessoa" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table "pessoa" alter column "empresa_id" type text using ("empresa_id"::text);`);
    this.addSql(`alter table "pessoa" alter column "endereco_id" type text using ("endereco_id"::text);`);
    this.addSql(`alter table "pessoa" alter column "criado_por_id" type text using ("criado_por_id"::text);`);
    this.addSql(`alter table "pessoa" alter column "atualizado_por_id" type text using ("atualizado_por_id"::text);`);

    this.addSql(`alter table "pessoa" drop constraint "pessoa_empresa_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_endereco_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_criado_por_id_foreign";`);
    this.addSql(`alter table "pessoa" drop constraint "pessoa_atualizado_por_id_foreign";`);

    this.addSql(`alter table "empresa_usuario" alter column "id" type text using ("id"::text);`);
    this.addSql(`alter table "empresa_usuario" alter column "empresa_id" type text using ("empresa_id"::text);`);
    this.addSql(`alter table "empresa_usuario" alter column "usuario_id" type text using ("usuario_id"::text);`);

    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_empresa_id_foreign";`);
    this.addSql(`alter table "empresa_usuario" drop constraint "empresa_usuario_usuario_id_foreign";`);

    this.addSql(`alter table "endereco" alter column "id" drop default;`);
    this.addSql(`alter table "endereco" alter column "id" type int using ("id"::int);`);
    this.addSql(`create sequence if not exists "endereco_id_seq";`);
    this.addSql(`select setval('endereco_id_seq', (select max("id") from "endereco"));`);
    this.addSql(`alter table "endereco" alter column "id" set default nextval('endereco_id_seq');`);

    this.addSql(`alter table "empresa" alter column "id" drop default;`);
    this.addSql(`alter table "empresa" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "empresa" alter column "matriz_id" type int using ("matriz_id"::int);`);
    this.addSql(`alter table "empresa" alter column "endereco_id" type int using ("endereco_id"::int);`);
    this.addSql(`alter table "empresa" alter column "matriz_filial" type varchar(1) using ("matriz_filial"::varchar(1));`);
    this.addSql(`create sequence if not exists "empresa_id_seq";`);
    this.addSql(`select setval('empresa_id_seq', (select max("id") from "empresa"));`);
    this.addSql(`alter table "empresa" alter column "id" set default nextval('empresa_id_seq');`);
    this.addSql(`alter table "empresa" add constraint "empresa_matriz_id_foreign" foreign key ("matriz_id") references "empresa" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "empresa" add constraint "empresa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "tipo_contato" alter column "id" drop default;`);
    this.addSql(`alter table "tipo_contato" alter column "id" type int using ("id"::int);`);
    this.addSql(`create sequence if not exists "tipo_contato_id_seq";`);
    this.addSql(`select setval('tipo_contato_id_seq', (select max("id") from "tipo_contato"));`);
    this.addSql(`alter table "tipo_contato" alter column "id" set default nextval('tipo_contato_id_seq');`);

    this.addSql(`alter table "contato" alter column "id" drop default;`);
    this.addSql(`alter table "contato" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "contato" alter column "tipo_contato_id" type int using ("tipo_contato_id"::int);`);
    this.addSql(`create sequence if not exists "contato_id_seq";`);
    this.addSql(`select setval('contato_id_seq', (select max("id") from "contato"));`);
    this.addSql(`alter table "contato" alter column "id" set default nextval('contato_id_seq');`);
    this.addSql(`alter table "contato" add constraint "contato_tipo_contato_id_foreign" foreign key ("tipo_contato_id") references "tipo_contato" ("id") on update cascade;`);

    this.addSql(`alter table "usuario" alter column "id" drop default;`);
    this.addSql(`alter table "usuario" alter column "id" type int using ("id"::int);`);
    this.addSql(`create sequence if not exists "usuario_id_seq";`);
    this.addSql(`select setval('usuario_id_seq', (select max("id") from "usuario"));`);
    this.addSql(`alter table "usuario" alter column "id" set default nextval('usuario_id_seq');`);

    this.addSql(`alter table "pessoa" alter column "id" drop default;`);
    this.addSql(`alter table "pessoa" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "pessoa" alter column "empresa_id" type int using ("empresa_id"::int);`);
    this.addSql(`alter table "pessoa" alter column "endereco_id" type int using ("endereco_id"::int);`);
    this.addSql(`alter table "pessoa" alter column "criado_por_id" type int using ("criado_por_id"::int);`);
    this.addSql(`alter table "pessoa" alter column "atualizado_por_id" type int using ("atualizado_por_id"::int);`);
    this.addSql(`create sequence if not exists "pessoa_id_seq";`);
    this.addSql(`select setval('pessoa_id_seq', (select max("id") from "pessoa"));`);
    this.addSql(`alter table "pessoa" alter column "id" set default nextval('pessoa_id_seq');`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_endereco_id_foreign" foreign key ("endereco_id") references "endereco" ("id") on update cascade;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_criado_por_id_foreign" foreign key ("criado_por_id") references "usuario" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "pessoa" add constraint "pessoa_atualizado_por_id_foreign" foreign key ("atualizado_por_id") references "usuario" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "empresa_usuario" alter column "id" drop default;`);
    this.addSql(`alter table "empresa_usuario" alter column "id" type int using ("id"::int);`);
    this.addSql(`alter table "empresa_usuario" alter column "empresa_id" type int using ("empresa_id"::int);`);
    this.addSql(`alter table "empresa_usuario" alter column "usuario_id" type int using ("usuario_id"::int);`);
    this.addSql(`create sequence if not exists "empresa_usuario_id_seq";`);
    this.addSql(`select setval('empresa_usuario_id_seq', (select max("id") from "empresa_usuario"));`);
    this.addSql(`alter table "empresa_usuario" alter column "id" set default nextval('empresa_usuario_id_seq');`);
    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_empresa_id_foreign" foreign key ("empresa_id") references "empresa" ("id") on update cascade;`);
    this.addSql(`alter table "empresa_usuario" add constraint "empresa_usuario_usuario_id_foreign" foreign key ("usuario_id") references "usuario" ("id") on update cascade;`);
  }

}
