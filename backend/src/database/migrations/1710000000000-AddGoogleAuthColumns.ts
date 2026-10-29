import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuthColumns1710000000000 implements MigrationInterface {
  name = 'AddGoogleAuthColumns1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "google_id" varchar(255),
        ADD COLUMN IF NOT EXISTS "is_verified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "first_name" varchar(80),
        ADD COLUMN IF NOT EXISTS "last_name" varchar(80),
        ADD COLUMN IF NOT EXISTS "name" varchar(100),
        ADD COLUMN IF NOT EXISTS "phone" varchar(30),
        ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now()
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_unique"
      ON "users" ("google_id") WHERE "google_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "users_google_id_unique"');
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "google_id",
        DROP COLUMN IF EXISTS "is_verified",
        DROP COLUMN IF EXISTS "first_name",
        DROP COLUMN IF EXISTS "last_name",
        DROP COLUMN IF EXISTS "name",
        DROP COLUMN IF EXISTS "phone",
        DROP COLUMN IF EXISTS "is_active",
        DROP COLUMN IF EXISTS "updated_at"
    `);
  }
}
