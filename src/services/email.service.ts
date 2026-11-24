import nodemailer from 'nodemailer';
import { config } from '../config.js';
import type { EmailMessage, EmailResult } from '../types/index.js';

// Created once and reused. MailHog needs no TLS or login; a real provider would add `secure` and `auth`.
const transporter = nodemailer.createTransport({
  host: config.email.smtpHost,
  port: config.email.smtpPort,
  secure: false,
});

// Generic: sends any message, with optional file attachments. Throws if the SMTP server is unreachable.
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const info = await transporter.sendMail({
    from: config.email.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments,
  });

  return { messageId: info.messageId, to: message.to };
}
