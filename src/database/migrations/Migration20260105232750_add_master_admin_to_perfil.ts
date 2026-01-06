import { Migration } from '@mikro-orm/migrations';

export class Migration20260105232750_add_master_admin_to_perfil extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "perfil" add column "master_admin" boolean not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "perfil" drop column "master_admin";`);
  }
}
