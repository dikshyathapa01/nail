import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  BookingEmailData,
  renderBookingEmail,
} from './common/booking-email.template';

const EMAIL_FROM_PATTERN = /^(?:[^<>]+\s*)?<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend?: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not configured; booking emails are disabled.',
      );
      return;
    }

    this.resend = new Resend(apiKey);
  }

  async sendAdminNotification(booking: BookingEmailData): Promise<void> {
    this.logger.log('Starting admin booking email notification...');

    if (!this.resend) {
      this.logger.error('Cannot send booking email: Resend is not configured.');
      return;
    }

    const notificationEmail =
      process.env.NOTIFICATION_EMAIL || 'nailinspo.72@gmail.com';

    const emailFrom = process.env.EMAIL_FROM?.trim();

    if (!emailFrom) {
      this.logger.error('Cannot send booking email: EMAIL_FROM is not configured.');
      return;
    }

    if (!EMAIL_FROM_PATTERN.test(emailFrom)) {
      throw new Error(
        `Invalid EMAIL_FROM configuration: "${emailFrom}". Set it to an email such as onboarding@resend.dev or "Nail Inspo <bookings@your-verified-domain.com>".`,
      );
    }

    this.logger.log(
      `Attempting to send booking email to ${notificationEmail}...`,
    );

    const html = renderBookingEmail(booking);
    const replyTo = booking.email?.trim();
    const subject = `New appointment request - ${booking.name || 'Client'}`;

    try {
      let lastError: Error | undefined;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const { data, error } = await this.resend.emails.send({
          from: emailFrom,
          to: [notificationEmail],
          subject,
          html,
          replyTo: replyTo || undefined,
        });

        if (!error) {
          this.logger.log(`EMAIL SENT SUCCESSFULLY. Resend ID=${data?.id}`);
          return;
        }

        lastError = new Error(error.message || 'Resend failed to send the email');
        this.logger.warn(`Resend attempt ${attempt}/3 failed: ${lastError.message}`);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
        }
      }

      throw lastError || new Error('Resend failed to send the email');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`EMAIL SEND FAILED: ${message}`);

      throw error;
    }
  }
}