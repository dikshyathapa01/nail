import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoles1710000000004 implements MigrationInterface {
  name = 'AddUserRoles1710000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "role" varchar(20) NOT NULL DEFAULT 'user'
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'admin'
      WHERE lower("email") IN (
        SELECT lower("email") FROM "admins" WHERE "is_active" = true
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "role"');
  }
}
