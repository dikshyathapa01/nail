import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { Booking } from './bookings/booking.entity';
import { BookingsModule } from './bookings/bookings.module';
import { GalleryModule } from './gallery/gallery.module';
import { GalleryItem } from './gallery/gallery.entity';
import { Admin } from './auth/admin.entity';

config({ path: join(__dirname, '..', '.env') });

@Module({
  imports: [
    AuthModule,
    BookingsModule,
    GalleryModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [User, Admin, Booking, GalleryItem],
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    }),
  ],
})
export class AppModule {}
