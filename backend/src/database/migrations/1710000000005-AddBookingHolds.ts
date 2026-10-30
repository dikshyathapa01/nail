import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingHolds1710000000005 implements MigrationInterface {
  name = 'AddBookingHolds1710000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "bookings_status_enum"
        ADD VALUE IF NOT EXISTS 'available'
    `);
    await queryRunner.query(`
      ALTER TYPE "bookings_status_enum"
        ADD VALUE IF NOT EXISTS 'rejected'
    `);
    await queryRunner.query(`
      ALTER TYPE "bookings_status_enum"
        ADD VALUE IF NOT EXISTS 'waitlisted'
    `);
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamptz
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "bookings_one_active_per_slot"');
    await queryRunner.query(`
      CREATE UNIQUE INDEX "bookings_one_active_per_slot"
      ON "bookings" (COALESCE("date", "booking_date"), "time")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "bookings_one_active_per_slot"');
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "hold_expires_at"
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "bookings_one_active_per_slot"
      ON "bookings" ("date", "time")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }
}
