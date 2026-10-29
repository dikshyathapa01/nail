import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/user.entity';
import { NotificationsService } from '../notifications.service';
import { Booking } from './booking.entity';
import { AvailabilityBlock } from './availability-block.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { DataSource } from 'typeorm';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, AvailabilityBlock, User]), AuthModule, RealtimeModule],
  controllers: [BookingsController],
  providers: [BookingsService, NotificationsService],
  exports: [BookingsService],
})
export class BookingsModule {}
