import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import nodemailer from 'nodemailer';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();
const connection = { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined, maxRetriesPerRequest: null,
  ...(process.env.REDIS_TLS === 'true' || process.env.REDIS_HOST?.includes('upstash.io') ? { tls: {} } : {}) };
const delivered = new Redis(connection);
const smtp = process.env.SMTP_HOST ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', requireTLS: process.env.NODE_ENV === 'production' && process.env.SMTP_PORT !== '465',
  ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {}) }) : null;
if (!process.env.RESEND_API_KEY && !smtp) throw new Error('Configure RESEND_API_KEY or SMTP_HOST for notification delivery');
const worker = new Worker('notifications', async (job: Job) => {
  const data = job.data;
  if (!['TRIP_INVITATION', 'SETTLEMENT_REMINDER', 'TASK_DUE'].includes(data.type)) throw new Error('Unknown notification type');
  if (typeof data.recipientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recipientEmail) || typeof data.message !== 'string' || !data.message.trim()) throw new Error('Invalid notification');
  const deliveryId = 'tripsync:notification:delivered:' + job.id;
  if (await delivered.get(deliveryId)) return { delivered: true, duplicate: true };
  const email = { from: process.env.EMAIL_FROM || 'TripSync <noreply@tripsync.app>', to: data.recipientEmail, subject: String(data.title || 'TripSync travel update').slice(0, 200), text: data.message };
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'tripsync-job-' + job.id }, body: JSON.stringify(email) });
    if (!response.ok) throw new Error('Email provider rejected notification: ' + response.status);
  } else {
    await smtp!.sendMail({ ...email, messageId: '<tripsync-' + job.id + '@tripsync.app>' });
  }
  await delivered.set(deliveryId, '1', 'EX', 30 * 86400);
  return { delivered: true };
}, { connection, concurrency: 3, limiter: { max: 10, duration: 1000 } });
worker.on('failed', (job, error) => console.error('Notification delivery failed', { jobId: job?.id, error: error.message }));
worker.on('error', error => console.error('Notification worker unavailable:', error.message));
const shutdown = async () => { await worker.close(); await delivered.quit(); smtp?.close(); };
process.once('SIGTERM', () => { void shutdown().then(() => process.exit(0)); });
process.once('SIGINT', () => { void shutdown().then(() => process.exit(0)); });
console.log('TripSync notification worker started');
