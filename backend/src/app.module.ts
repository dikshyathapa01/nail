import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { UserSession } from './auth/user-session.entity';
import { Booking } from './bookings/booking.entity';
import { AvailabilityBlock } from './bookings/availability-block.entity';
import { BookingsModule } from './bookings/bookings.module';
import { GalleryModule } from './gallery/gallery.module';
import { GalleryItem } from './gallery/gallery.entity';
import { Admin } from './auth/admin.entity';
import { CategoriesModule } from './categories/categories.module';
import { ServiceCategory } from './categories/category.entity';
import { ServicesModule } from './services/services.module';
import { StudioService } from './services/service.entity';
import { RealtimeModule } from './realtime/realtime.module';
import { AddGoogleAuthColumns1710000000000 } from './database/migrations/1710000000000-AddGoogleAuthColumns';
import { CreateUserSessions1710000000001 } from './database/migrations/1710000000001-CreateUserSessions';

config({ path: join(__dirname, '..', '.env') });

@Module({
  imports: [
    AuthModule,
    RealtimeModule,
    BookingsModule,
    GalleryModule,
    CategoriesModule,
    ServicesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [User, UserSession, Admin, Booking, AvailabilityBlock, GalleryItem, ServiceCategory, StudioService],
      autoLoadEntities: true,
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      migrations: [AddGoogleAuthColumns1710000000000, CreateUserSessions1710000000001],
      migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN !== 'false',
    }),
  ],
})
export class AppModule {}
