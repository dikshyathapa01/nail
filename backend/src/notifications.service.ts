import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.resend = new Resend(apiKey);
  }

  async sendAdminNotification(booking: any): Promise<void> {
    this.logger.log('Starting admin booking email notification...');

    const notificationEmail =
      process.env.NOTIFICATION_EMAIL || 'dikshyathapa987@gmail.com';

    const emailFrom =
      process.env.EMAIL_FROM || 'onboarding@resend.dev';

    const {
      name,
      service,
      date,
      time,
      phone,
      email,
      notes,
    } = booking;

    this.logger.log(
      `Attempting to send booking email to ${notificationEmail}...`,
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>New Nail Booking</title>
        </head>

        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Nail Appointment Booking</h2>

          <p>A new appointment has been booked.</p>

          <table
            cellpadding="8"
            cellspacing="0"
            border="1"
            style="border-collapse: collapse;"
          >
            <tr>
              <td><strong>Name</strong></td>
              <td>${name ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Service</strong></td>
              <td>${service ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Date</strong></td>
              <td>${date ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Time</strong></td>
              <td>${time ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Phone</strong></td>
              <td>${phone ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Email</strong></td>
              <td>${email ?? ''}</td>
            </tr>

            <tr>
              <td><strong>Notes</strong></td>
              <td>${notes ?? ''}</td>
            </tr>
          </table>

          <p>
            Please check the admin booking system for more details.
          </p>
        </body>
      </html>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: emailFrom,
        to: [notificationEmail],
        subject: `New Nail Booking - ${name ?? 'Customer'}`,
        html,
        replyTo: email || undefined,
      });

      if (error) {
        this.logger.error(
          `RESEND EMAIL FAILED: ${JSON.stringify(error)}`,
        );

        throw new Error(
          error.message || 'Resend failed to send the email',
        );
      }

      this.logger.log(
        `EMAIL SENT SUCCESSFULLY. Resend ID=${data?.id}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`EMAIL SEND FAILED: ${message}`);

      throw error;
    }
  }
}