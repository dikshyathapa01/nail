import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

import {
  BOOKING_TIMES,
  CreateBookingDto,
} from './dto/create-booking.dto';

import { NotificationsService } from '../notifications.service';

type StoredBooking = CreateBookingDto & {
  id: string;
  createdAt: string;
};

@Injectable()
export class BookingsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BookingsService.name);

  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is required to start the booking API.',
      );
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY,
        service VARCHAR(100) NOT NULL,
        "date" DATE NOT NULL,
        "time" VARCHAR(30) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(30),
        email VARCHAR(160),
        notes VARCHAR(300),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("date", "time")
      )
    `);

    this.logger.log('Bookings database initialized successfully.');
  }

  async create(booking: CreateBookingDto) {
    const now = new Date();

    const today = [
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    ]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const [hours, minutes] = booking.time
      .slice(0, 5)
      .split(':')
      .map(Number);

    // Prevent booking a time that has already passed today.
    if (
      booking.date === today &&
      currentMinutes >= hours * 60 + minutes
    ) {
      throw new ConflictException(
        'That appointment time has already passed. Please choose another slot.',
      );
    }

    // Check whether this time is already booked.
    const existingBooking = await this.pool.query(
      'SELECT 1 FROM bookings WHERE "date" = $1 AND "time" = $2',
      [booking.date, booking.time],
    );

    if (
      existingBooking.rowCount &&
      existingBooking.rowCount > 0
    ) {
      throw new ConflictException(
        'That time is already requested. Please choose another slot.',
      );
    }

    try {
      // Save booking to PostgreSQL.
      const result = await this.pool.query<StoredBooking>(
        `
          INSERT INTO bookings (
            id,
            service,
            "date",
            "time",
            name,
            phone,
            email,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING
            id,
            service,
            "date" AS date,
            "time" AS time,
            name,
            phone,
            email,
            notes,
            created_at AS "createdAt"
        `,
        [
          randomUUID(),
          booking.service,
          booking.date,
          booking.time,
          booking.name,
          booking.phone ?? null,
          booking.email ?? null,
          booking.notes ?? null,
        ],
      );

      const savedBooking = result.rows[0];

      this.logger.log(
        `Booking created successfully: ${savedBooking.id}`,
      );

      /*
       * Send email notification.
       *
       * We intentionally await this during debugging so
       * SMTP errors appear clearly in Render logs.
       */
      try {
        await this.notificationsService.sendAdminNotification(
          savedBooking,
        );

        this.logger.log(
          `Booking notification email sent for booking ${savedBooking.id}`,
        );
      } catch (emailError) {
        this.logger.error(
          `Booking was saved, but notification email failed: ${
            emailError instanceof Error
              ? emailError.message
              : String(emailError)
          }`,
        );

        /*
         * We do NOT delete the booking if the email fails.
         *
         * The appointment is already saved in the database.
         * The email problem should be fixed separately.
         */
      }

      return {
        id: savedBooking.id,
        service: savedBooking.service,
        date: savedBooking.date,
        time: savedBooking.time,
        name: savedBooking.name,
        phone: savedBooking.phone,
        email: savedBooking.email,
        notes: savedBooking.notes,
        message: 'Your appointment request has been received.',
      };
    } catch (error) {
      // PostgreSQL unique constraint violation.
      if (
        (error as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'That time is already requested. Please choose another slot.',
        );
      }

      throw error;
    }
  }

  async getAvailability(date: string) {
    const result = await this.pool.query<{ time: string }>(
      'SELECT "time" FROM bookings WHERE "date" = $1',
      [date],
    );

    const bookedTimes = new Set(
      result.rows.map((booking) => booking.time),
    );

    const now = new Date();

    const today = [
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    ]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    return {
      date,

      slots: BOOKING_TIMES.map((time) => {
        const [hours, minutes] = time
          .slice(0, 5)
          .split(':')
          .map(Number);

        const hasStarted =
          date === today &&
          currentMinutes >= hours * 60 + minutes;

        return {
          time,
          available:
            !bookedTimes.has(time) && !hasStarted,
        };
      }),
    };
  }

  async list() {
    const result = await this.pool.query<StoredBooking>(
      `
        SELECT
          id,
          service,
          "date" AS date,
          "time" AS time,
          name,
          phone,
          email,
          notes,
          created_at AS "createdAt"
        FROM bookings
        ORDER BY created_at DESC
      `,
    );

    return result.rows;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}