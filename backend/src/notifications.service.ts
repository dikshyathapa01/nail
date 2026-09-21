import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    const secureStr = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !portStr || !user || !pass) {
      this.logger.warn(
        'SMTP configuration is missing or incomplete (requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Email notifications will be disabled.',
      );
      return;
    }

    const port = Number(portStr);
    const secure = secureStr === 'true';

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('SMTP transporter successfully initialized.');
    } catch (error) {
      this.logger.error('Failed to initialize SMTP transporter', error);
      this.transporter = null;
    }
  }

  async sendAdminNotification(booking: any): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email notification skipped: SMTP transporter is not configured.');
      return;
    }

    const to = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (!to) {
      this.logger.warn('Email notification skipped: Neither NOTIFICATION_EMAIL nor SMTP_USER is set.');
      return;
    }

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    const {
      name = 'N/A',
      service = 'N/A',
      date = 'N/A',
      time = 'N/A',
      phone = 'N/A',
      email = 'N/A',
      notes = 'None',
    } = booking || {};

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #f72585; color: #ffffff; padding: 18px 24px;">
          <h2 style="margin: 0; font-size: 20px;">New Booking Notification</h2>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0;">A new appointment has been successfully scheduled. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tbody>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 35%;">Client Name:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Service:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Date:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Time:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Notes:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${notes || 'None'}</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 12px; color: #888; margin-top: 24px; margin-bottom: 0;">
            This is an automated notification sent from the Studio Appointment Booking System.
          </p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `New Booking Confirmed: ${service} - ${name} (${date} at ${time})`,
        html,
      });
      this.logger.log(`Admin booking notification sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send admin notification email: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
