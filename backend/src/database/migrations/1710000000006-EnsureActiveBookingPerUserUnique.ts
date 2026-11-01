import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureActiveBookingPerUserUnique1710000000006
  implements MigrationInterface
{
  name = 'EnsureActiveBookingPerUserUnique1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_user"
      ON "bookings" ("user_id")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "bookings_one_active_per_user"',
    );
  }
}
