import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUserSessions1710000000002 implements MigrationInterface {
  name = 'EnsureUserSessions1710000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "device_id" varchar(160) NOT NULL,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_seen_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "user_sessions_user_device_unique" UNIQUE ("user_id", "device_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx"
      ON "user_sessions" ("user_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "user_sessions_user_id_idx"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_sessions"');
  }
}
