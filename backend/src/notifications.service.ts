import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import {
  BookingEmailData,
  renderBookingEmail,
  renderBookingStatusEmail,
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

  async sendClientStatusNotification(
    booking: BookingEmailData & { status: string },
  ): Promise<void> {
    const recipient = booking.email?.trim();
    if (!recipient) {
      this.logger.warn('Cannot send client status email: booking has no email.');
      return;
    }
    if (!this.resend) {
      this.logger.error('Cannot send client status email: Resend is not configured.');
      return;
    }

    const emailFrom = process.env.EMAIL_FROM?.trim();
    if (!emailFrom || !EMAIL_FROM_PATTERN.test(emailFrom)) {
      this.logger.error('Cannot send client status email: EMAIL_FROM is invalid or missing.');
      return;
    }

    const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
    const { error } = await this.resend.emails.send({
      from: emailFrom,
      to: [recipient],
      subject: `Appointment ${statusLabel.toLowerCase()} - Nail Inspo Studio`,
      html: renderBookingStatusEmail(booking),
    });
    if (error) {
      throw new Error(error.message || 'Resend failed to send the client email.');
    }
    this.logger.log(`Client status email sent for appointment ${booking.date} ${booking.time}.`);
  }

  async sendVerificationEmail(to: string, name: string, link: string) {
    const host = process.env.SMTP_HOST;
    const from = process.env.EMAIL_FROM?.trim();
    if (!host || !from) {
      this.logger.error('Email verification is unavailable: SMTP_HOST and EMAIL_FROM are required.');
      throw new ServiceUnavailableException(
        'Email verification is not configured. Set SMTP_HOST and EMAIL_FROM on the backend.',
      );
    }
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your Nail Inspo account',
      text: `Hi ${name}, verify your account here: ${link}`,
      html: `<p>Hi ${name},</p><p><a href="${link}">Verify your Nail Inspo account</a></p>`,
    });
  }
}