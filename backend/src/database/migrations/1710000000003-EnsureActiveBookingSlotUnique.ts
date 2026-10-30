import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureActiveBookingSlotUnique1710000000003
  implements MigrationInterface
{
  name = 'EnsureActiveBookingSlotUnique1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_slot"
      ON "bookings" ("date", "time")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "bookings_one_active_per_slot"',
    );
  }
}
