import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendTripInviteOptions {
  to: string;
  tripName: string;
  tripDestination?: string;
  inviterName: string;
  role: string;
  inviteLink: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('SMTP_PASSWORD') || this.configService.get<string>('GMAIL_APP_PASSWORD');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;

    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('SMTP_FROM') || user || 'TripSync <noreply@tripsync.app>';

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(`📧 SMTP Transporter initialized (${host}:${port})`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize SMTP transporter: ${err.message}`);
      }
    } else if (user && pass && !host) {
      // Convenience: default to Gmail SMTP if user and pass provided without host
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
        });
        this.logger.log(`📧 Gmail SMTP Transporter initialized for ${user}`);
      } catch (err: any) {
        this.logger.error(`Failed to initialize Gmail transporter: ${err.message}`);
      }
    } else {
      this.logger.warn('⚠️ No SMTP configuration found (SMTP_HOST / SMTP_USER / SMTP_PASS). Emails will be logged to console.');
    }
  }

  /**
   * Sends a trip invitation email.
   * Returns { sent: true } if delivered via SMTP/Resend, or { sent: false } if simulated.
   */
  async sendTripInvitation(options: SendTripInviteOptions): Promise<{ sent: boolean; message?: string }> {
    const { to, tripName, tripDestination, inviterName, role, inviteLink } = options;

    const subject = `You're invited to join ${tripName} on TripSync! ✈️`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; }
    .body { padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
    .trip-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left; }
    .trip-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
    .trip-meta { font-size: 13px; color: #64748b; margin: 0; }
    .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin: 24px 0 16px 0; }
    .btn:hover { background-color: #1e293b; }
    .direct-link { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 16px; }
    .footer { border-top: 1px solid #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #fcfcfc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TripSync</h1>
      <p>Group Travel, Simplified</p>
    </div>
    <div class="body">
      <div class="badge">Trip Invitation</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0;">You've Been Invited!</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${inviterName}</strong> has invited you to join a trip as a <strong>${role}</strong>.
      </p>
      
      <div class="trip-card">
        <div class="trip-name">✈️ ${tripName}</div>
        ${tripDestination ? `<div class="trip-meta">📍 Destination: <strong>${tripDestination}</strong></div>` : ''}
      </div>

      <a href="${inviteLink}" class="btn" target="_blank">Accept Invitation & Join Trip</a>

      <p class="direct-link">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
      </p>
    </div>
    <div class="footer">
      This invitation was sent by TripSync on behalf of ${inviterName}.
    </div>
  </div>
</body>
</html>
    `;

    // 1. Check if Resend API Key is set
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        let fromAddress = this.fromEmail;
        // Resend cannot send from @gmail.com, @yahoo.com, etc. unless using a verified domain or onboarding@resend.dev
        if (
          fromAddress.includes('@gmail.com') ||
          fromAddress.includes('@yahoo.com') ||
          fromAddress.includes('@outlook.com') ||
          fromAddress.includes('@hotmail.com')
        ) {
          this.logger.warn(
            `⚠️ Resend requires a verified domain or onboarding@resend.dev (cannot send from public ${fromAddress}). Using "TripSync <onboarding@resend.dev>".`
          );
          fromAddress = 'TripSync <onboarding@resend.dev>';
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject,
            html,
          }),
        });

        if (res.ok) {
          this.logger.log(`✅ [Resend] Invitation email sent to ${to}`);
          return { sent: true };
        } else {
          const errData = await res.json().catch(() => ({}));
          this.logger.error(`❌ [Resend] Failed to send email to ${to}: ${JSON.stringify(errData)}`);
        }
      } catch (err: any) {
        this.logger.error(`❌ [Resend] Network error sending to ${to}: ${err.message}`);
      }
    }

    // 2. Check if SMTP Transporter is configured
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
          text: `You have been invited to join "${tripName}" on TripSync by ${inviterName}.\n\nClick here to join: ${inviteLink}`,
        });
        this.logger.log(`✅ [SMTP] Invitation email sent to ${to}`);
        return { sent: true };
      } catch (err: any) {
        this.logger.error(`❌ [SMTP] Failed to send email to ${to}: ${err.message}`);
      }
    }

    // 3. Fallback: Log to console
    this.logger.log(`\n======================================================\n📨 [SIMULATED EMAIL DISPATCH]\nTo: ${to}\nSubject: ${subject}\nInvite Link: ${inviteLink}\n(Configure SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY in .env for live email delivery)\n======================================================\n`);
    return { sent: false, message: 'SMTP not configured in .env' };
  }
}
