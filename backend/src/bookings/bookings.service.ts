import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { LessThanOrEqual } from 'typeorm';
import { DataSource } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import { AvailabilityBlock } from './availability-block.entity';
import {
  BOOKING_TIMES,
  CreateBookingDto,
} from './dto/create-booking.dto';
import { NotificationsService } from '../notifications.service';
import { User } from '../auth/user.entity';
import { verifyRealEmail } from '../common/email-verifier';
import { AvailabilityBlockDto } from './dto/availability-block.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserSyncGateway } from '../realtime/user-sync.gateway';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly holdDurationMs = 10 * 60 * 1000;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(AvailabilityBlock)
    private readonly availabilityBlockRepository: Repository<AvailabilityBlock>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    private readonly userSyncGateway: UserSyncGateway,
  ) {}

  private toResponse(booking: Booking) {
    return {
      id: booking.id,
      service: booking.service,
      date: booking.date || booking.bookingDate,
      booking_date: booking.bookingDate || booking.date,
      time: booking.time,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      notes: booking.notes || booking.details,
      details: booking.details || booking.notes,
      userId: booking.user?.id || booking.userId || null,
      status: booking.status,
      holdExpiresAt: booking.holdExpiresAt?.toISOString() || null,
      createdAt: booking.createdAt?.toISOString(),
    };
  }

  async create(booking: CreateBookingDto) {
    if (booking.email) {
      await verifyRealEmail(booking.email);
    }

    const bookingDate = booking.date || booking.booking_date;
    if (!bookingDate) {
      throw new ConflictException('A booking date is required.');
    }

    const now = new Date();
    const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
    if (bookingDate <= today) {
      throw new ConflictException(
        'Appointments can only be booked from tomorrow onward.',
      );
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = booking.time.slice(0, 5).split(':').map(Number);

    if (bookingDate === today && currentMinutes >= hours * 60 + minutes) {
      throw new ConflictException(
        'That appointment time has already passed. Please choose another slot.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: booking.userId } });
    if (!user) throw new ConflictException('Authenticated Google account was not found.');

    const normalizedPhone = booking.phone.trim();
    if (user.phone && user.phone !== normalizedPhone) {
      throw new ConflictException('This account already has a phone number saved. Use the same number.');
    }

    await this.expirePendingHolds();
    const existingBooking = await this.bookingRepository.findOne({
      where: [
        { user: { id: user.id }, status: BookingStatus.PENDING },
        { user: { id: user.id }, status: BookingStatus.CONFIRMED },
      ],
    });
    if (existingBooking) {
      throw new ConflictException('You can have only one active appointment at a time.');
    }

    if (!user.phone) {
      user.phone = normalizedPhone;
      await this.userRepository.save(user);
    }

    const entity = this.bookingRepository.create({
      user,
      service: booking.service,
      date: bookingDate,
      bookingDate,
      time: booking.time,
      status: BookingStatus.PENDING,
      holdExpiresAt: new Date(Date.now() + this.holdDurationMs),
      details: booking.details || booking.notes || null,
      name: booking.name,
      phone: normalizedPhone,
      email: booking.email || null,
      notes: booking.notes || booking.details || null,
    });

    let savedBooking: Booking;
    try {
      savedBooking = await this.dataSource.transaction(async (manager) => {
        await manager.query(
          `SELECT id FROM "bookings"
           WHERE COALESCE("date", "booking_date") = $1
             AND "time" = $2
             AND "status" IN ('pending', 'confirmed')
           FOR UPDATE`,
          [bookingDate, booking.time],
        );
        await manager
          .createQueryBuilder()
          .update(Booking)
          .set({ status: BookingStatus.REJECTED, holdExpiresAt: null })
          .where(`"status" = :status AND "hold_expires_at" <= NOW()`, {
            status: BookingStatus.PENDING,
          })
          .execute();
        const blocked = await manager.find(AvailabilityBlock, { where: { date: bookingDate } });
        if (blocked.some((item) => item.time === 'FULL_DAY' || item.time === booking.time)) {
          throw new ConflictException('That date or time is unavailable. Please choose another slot.');
        }
        return manager.save(manager.create(Booking, entity));
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        if ((error as { constraint?: string }).constraint === 'bookings_one_active_per_user') {
          throw new ConflictException('You can have only one active appointment at a time.');
        }
        throw new ConflictException(
          'That time is already requested. Please choose another slot.',
        );
      }
      throw error;
    }

    const response = this.toResponse(savedBooking);
    this.userSyncGateway.emitUserEvent(savedBooking.userId, 'booking:updated', {
      action: 'created',
      booking: response,
    });
    this.logger.log(`Booking created successfully: ${savedBooking.id}`);

    try {
      await this.notificationsService.sendAdminNotification(response);
      this.logger.log(`Booking notification email sent for booking ${savedBooking.id}`);
    } catch (emailError) {
      this.logger.error(
        `Booking was saved, but notification email failed: ${
          emailError instanceof Error ? emailError.message : String(emailError)
        }`,
      );
    }

    return {
      ...response,
      message: 'Your appointment request has been received.',
    };
  }

  async getAvailability(date: string) {
    await this.expirePendingHolds();
    const activeBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('(booking."date" = :date OR booking."booking_date" = :date)', { date })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .getMany();
    const bookedTimes = new Map(activeBookings.map((booking) => [booking.time, booking.status]));
    const blocks = await this.availabilityBlockRepository.find({ where: { date } });
    const fullDayBlocked = blocks.some((block) => block.time === 'FULL_DAY');
    const blockedTimes = new Set(blocks.map((block) => block.time));

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
        const status = bookedTimes.get(time);
        return {
          time,
          available: !fullDayBlocked && !blockedTimes.has(time) && !status && !hasStarted,
          status: status || BookingStatus.AVAILABLE,
        };
      }),
    };
  }

  private async expirePendingHolds() {
    await this.bookingRepository.update(
      {
        status: BookingStatus.PENDING,
        holdExpiresAt: LessThanOrEqual(new Date()),
      },
      {
        status: BookingStatus.REJECTED,
        holdExpiresAt: null,
      },
    );
  }

  listAvailabilityBlocks() {
    return this.availabilityBlockRepository.find({ order: { date: 'ASC', time: 'ASC' } });
  }

  async createAvailabilityBlock(block: AvailabilityBlockDto) {
    const time = block.time || 'FULL_DAY';
    const existing = await this.availabilityBlockRepository.findOne({ where: { date: block.date, time } });
    if (existing) throw new ConflictException('That date or time is already unavailable.');
    return this.availabilityBlockRepository.save(this.availabilityBlockRepository.create({ date: block.date, time }));
  }

  async deleteAvailabilityBlock(id: string) {
    const result = await this.availabilityBlockRepository.delete(id);
    if (!result.affected) throw new ConflictException('Availability block not found.');
    return { message: 'Availability block removed.' };
  }

  async list(userId?: string, email?: string) {
    await this.expirePendingHolds();
    const where = userId
      ? [
          { user: { id: userId }, status: BookingStatus.PENDING },
          { user: { id: userId }, status: BookingStatus.CONFIRMED },
          { user: { id: userId }, status: BookingStatus.COMPLETED },
        ]
      : email
      ? [
          { email: ILike(email) },
        ]
      : undefined;

    const bookings = await this.bookingRepository.find({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return bookings.map((booking) => this.toResponse(booking));
  }

  async updateStatus(id: string, status: BookingStatus) {
    await this.expirePendingHolds();
    let savedBooking: Booking;
    try {
      savedBooking = await this.dataSource.transaction(async (manager) => {
        const booking = await manager.findOne(Booking, {
          where: { id },
          relations: { user: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!booking) throw new ConflictException('Appointment not found.');
        const bookingDate = booking.date || booking.bookingDate;
        if (status === BookingStatus.CONFIRMED && bookingDate) {
          await manager
            .createQueryBuilder()
            .update(Booking)
            .set({ status: BookingStatus.REJECTED, holdExpiresAt: null })
            .where(`id <> :id
              AND COALESCE("date", "booking_date") = :date
              AND "time" = :time
              AND "status" IN (:...statuses)`, {
              id,
              date: bookingDate,
              time: booking.time,
              statuses: [BookingStatus.PENDING, BookingStatus.WAITLISTED],
            })
            .execute();
        }
        booking.status = status;
        booking.holdExpiresAt = status === BookingStatus.PENDING
          ? new Date(Date.now() + this.holdDurationMs)
          : null;
        return manager.save(booking);
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('That time is already confirmed by another appointment.');
      }
      throw error;
    }
    const response = this.toResponse(savedBooking);
    if (savedBooking.userId) {
      this.userSyncGateway.emitUserEvent(savedBooking.userId, 'booking:updated', { action: 'status', booking: response });
    }
    if (status === BookingStatus.CONFIRMED || status === BookingStatus.CANCELLED || status === BookingStatus.COMPLETED) {
      try {
        await this.notificationsService.sendClientStatusNotification({
          ...response,
          status,
        });
      } catch (emailError) {
        this.logger.error(
          `Appointment status was saved, but client notification failed: ${
            emailError instanceof Error ? emailError.message : String(emailError)
          }`,
        );
      }
    }
    return response;
  }

  async updateForUser(id: string, userId: string, dto: UpdateBookingDto) {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: { user: true } });
    if (!booking || booking.userId !== userId) throw new ConflictException('Appointment not found.');
    this.assertChangeable(booking);
    const date = dto.date || booking.date || booking.bookingDate;
    if (!date) throw new ConflictException('Appointment date is missing.');
    const time = dto.time || booking.time;
    const today = new Date().toISOString().slice(0, 10);
    if (date <= today) throw new ConflictException('Appointments must be scheduled from tomorrow onward.');
    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const conflict = await manager.findOne(Booking, {
          where: [
            { date, time, status: BookingStatus.PENDING },
            { date, time, status: BookingStatus.CONFIRMED },
            { bookingDate: date, time, status: BookingStatus.PENDING },
            { bookingDate: date, time, status: BookingStatus.CONFIRMED },
          ],
        });
        if (conflict && conflict.id !== id) throw new ConflictException('That time is already requested.');
        const blocks = await manager.find(AvailabilityBlock, { where: { date } });
        if (blocks.some((block) => block.time === 'FULL_DAY' || block.time === time)) {
          throw new ConflictException('That date or time is unavailable.');
        }
        booking.service = dto.service || booking.service;
        booking.date = date;
        booking.bookingDate = date;
        booking.time = time;
        booking.holdExpiresAt = new Date(Date.now() + this.holdDurationMs);
        if (dto.notes !== undefined) {
          booking.notes = dto.notes;
          booking.details = dto.notes;
        }
        return manager.save(booking);
      });
      const response = this.toResponse(saved);
      this.userSyncGateway.emitUserEvent(userId, 'booking:updated', { action: 'updated', booking: response });
      return response;
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('That time is already requested.');
      throw error;
    }
  }

  async cancelForUser(id: string, userId: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking || booking.userId !== userId) throw new ConflictException('Appointment not found.');
    this.assertChangeable(booking);
    booking.status = BookingStatus.CANCELLED;
    booking.holdExpiresAt = null;
    const response = this.toResponse(await this.bookingRepository.save(booking));
    if (booking.userId) {
      this.userSyncGateway.emitUserEvent(booking.userId, 'booking:updated', { action: 'status', booking: response });
    }
    return response;
  }

  private assertChangeable(booking: Booking) {
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new ConflictException('This appointment can no longer be changed.');
    }
    const appointment = new Date(`${booking.date || booking.bookingDate}T${booking.time.slice(0, 5)}:00`);
    if (appointment.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      throw new ConflictException('Appointments can only be changed at least 24 hours in advance.');
    }
  }
}
