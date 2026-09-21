import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    NotificationsService,
    {
      provide: 'DATABASE_POOL',
      useFactory: () => {
        return new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        });
      },
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class AppModule {}
