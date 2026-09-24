import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Booking, BookingStatus } from './booking.entity';
import {
  BOOKING_TIMES,
  CreateBookingDto,
} from './dto/create-booking.dto';
import { NotificationsService } from '../notifications.service';
import { User } from '../auth/user.entity';
import { verifyRealEmail } from '../common/email-verifier';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
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
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = booking.time.slice(0, 5).split(':').map(Number);

    if (bookingDate === today && currentMinutes >= hours * 60 + minutes) {
      throw new ConflictException(
        'That appointment time has already passed. Please choose another slot.',
      );
    }

    const existingBooking = await this.bookingRepository.findOne({
      where: { date: bookingDate, time: booking.time },
    });
    if (existingBooking) {
      throw new ConflictException(
        'That time is already requested. Please choose another slot.',
      );
    }

    const user = booking.userId
      ? await this.userRepository.findOne({ where: { id: booking.userId } })
      : null;

    const entity = this.bookingRepository.create({
      user: user || null,
      service: booking.service,
      date: bookingDate,
      bookingDate,
      time: booking.time,
      status: BookingStatus.PENDING,
      details: booking.details || booking.notes || null,
      name: booking.name,
      phone: booking.phone || null,
      email: booking.email || null,
      notes: booking.notes || booking.details || null,
    });

    let savedBooking: Booking;
    try {
      savedBooking = await this.bookingRepository.save(entity);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'That time is already requested. Please choose another slot.',
        );
      }
      throw error;
    }

    const response = this.toResponse(savedBooking);
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
    const bookings = await this.bookingRepository.find({
      where: { date },
    });
    const bookedTimes = new Set(bookings.map((booking) => booking.time));

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

  async list(userId?: string, email?: string) {
    const where = userId || email
      ? [
          ...(userId ? [{ user: { id: userId } }] : []),
          ...(email ? [{ email: ILike(email) }] : []),
        ]
      : undefined;

    const bookings = await this.bookingRepository.find({
      where,
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    return bookings.map((booking) => this.toResponse(booking));
  }
}
