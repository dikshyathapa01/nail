import { ConflictException, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { BOOKING_TIMES, CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications.service';

type StoredBooking = CreateBookingDto & {
  id: string;
  createdAt: string;
};

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  // 1. Enforced SSL configuration block so Neon accepts the connection string handshake
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to start the booking API.');
    }

    // 2. Optimized table setup script. 
    // Alter commands are omitted because the table structure matches your production requirements perfectly.
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
  }

  async create(booking: CreateBookingDto) {
    const now = new Date();
    const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = booking.time.slice(0, 5).split(':').map(Number);
    
    if (booking.date === today && currentMinutes >= hours * 60 + minutes) {
      throw new ConflictException('That appointment time has already passed. Please choose another slot.');
    }

    const existingBooking = await this.pool.query(
      'SELECT 1 FROM bookings WHERE "date" = \$1 AND "time" = \$2',
      [booking.date, booking.time],
    );
    
    if (existingBooking.rowCount && existingBooking.rowCount > 0) {
      throw new ConflictException('That time is already requested. Please choose another slot.');
    }

    try {
      const result = await this.pool.query<StoredBooking>(
        `INSERT INTO bookings (id, service, "date", "time", name, phone, email, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, service, "date" AS date, "time" AS time, name, phone, email, notes, created_at AS "createdAt"`,
        [
          randomUUID(), 
          booking.service, 
          booking.date, 
          booking.time, 
          booking.name, 
          booking.phone ?? null, 
          booking.email ?? null, 
          booking.notes ?? null
        ],
      );
      const savedBooking = result.rows[0];

      // Fire-and-forget admin notification (independent and decoupled)
      void this.notificationsService.sendAdminNotification(savedBooking).catch(() => {});

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
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('That time is already requested. Please choose another slot.');
      }
      throw error;
    }
  }

  async getAvailability(date: string) {
    const result = await this.pool.query<{ time: string }>(
      'SELECT "time" FROM bookings WHERE "date" = \$1',
      [date],
    );
    const bookedTimes = new Set(result.rows.map((booking) => booking.time));
    const now = new Date();
    const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return {
      date,
      slots: BOOKING_TIMES.map((time) => {
        const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
        const hasStarted = date === today && currentMinutes >= hours * 60 + minutes;
        return { time, available: !bookedTimes.has(time) && !hasStarted };
      }),
    };
  }

  async list() {
    const result = await this.pool.query<StoredBooking>(
      'SELECT id, service, "date" AS date, "time" AS time, name, phone, email, notes, created_at AS "createdAt" FROM bookings ORDER BY created_at DESC',
    );
    return result.rows;
  }

  // 3. Added a clean destruction lifecycle hook to close dangling database connections gracefully during builds
  async onModuleDestroy() {
    await this.pool.end();
  }
}
