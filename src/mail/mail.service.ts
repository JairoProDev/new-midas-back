import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      this.logger.warn('SMTP credentials not provided. Email functionality will be disabled.');
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    if (!this.transporter) {
      this.logger.warn('Email service is not configured. Skipping verification email.');
      return;
    }

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: email,
        subject: 'Verify your email address',
        html: `
          <h1>Welcome!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    if (!this.transporter) {
      this.logger.warn('Email service is not configured. Skipping password reset email.');
      return;
    }

    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_USER'),
        to: email,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password. Click the link below to create a new password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }
}
