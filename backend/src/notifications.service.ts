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
      this.logger.error(
        'SMTP configuration is missing. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS',
      );
      return;
    }

    const port = Number(portStr);
    const secure = secureStr === 'true';

    if (Number.isNaN(port)) {
      this.logger.error(`Invalid SMTP_PORT: ${portStr}`);
      return;
    }

    this.logger.log(
      `Creating SMTP transporter: host=${host}, port=${port}, secure=${secure}, user=${user}`,
    );

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,

        auth: {
          user,
          pass,
        },

        // Prevent Render from waiting forever if SMTP cannot connect.
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });

      this.logger.log('SMTP transporter created successfully.');

      // Verify the Gmail SMTP connection.
      this.transporter.verify((error) => {
        if (error) {
          this.logger.error(
            `SMTP VERIFICATION FAILED: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        } else {
          this.logger.log('SMTP VERIFICATION SUCCESSFUL');
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to create SMTP transporter: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      this.transporter = null;
    }
  }

  async sendAdminNotification(booking: any): Promise<void> {
    this.logger.log('Starting admin booking email notification...');

    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured.');
    }

    const to =
      process.env.NOTIFICATION_EMAIL ||
      process.env.SMTP_USER;

    if (!to) {
      throw new Error(
        'NOTIFICATION_EMAIL and SMTP_USER are both missing.',
      );
    }

    const from =
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER;

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
      <!DOCTYPE html>
      <html>
        <body
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          "
        >
          <h2>New Appointment Booking</h2>

          <p>
            A new appointment has been booked through
            your portfolio website.
          </p>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              max-width: 600px;
            "
          >
            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Name</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${name}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Service</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${service}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Date</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${date}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Time</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${time}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Phone</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${phone}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Email</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${email}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                <strong>Notes</strong>
              </td>

              <td
                style="
                  padding: 8px;
                  border: 1px solid #ddd;
                "
              >
                ${notes}
              </td>
            </tr>
          </table>

          <p>
            <strong>
              Appointment successfully saved in the database.
            </strong>
          </p>
        </body>
      </html>
    `;

    try {
      this.logger.log(
        `Attempting to send booking email to ${to}...`,
      );

      const info = await this.transporter.sendMail({
        from,
        to,
        subject: `New Booking Confirmed: ${service} - ${name} (${date} at ${time})`,
        html,
      });

      this.logger.log(
        `EMAIL SENT SUCCESSFULLY. MessageId=${info.messageId}`,
      );

      this.logger.log(
        `Booking notification sent to ${to}`,
      );
    } catch (error) {
      this.logger.error(
        `EMAIL SEND FAILED: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}