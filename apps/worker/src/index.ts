import { Worker, Job } from 'bullmq';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const isTls =
  process.env.REDIS_TLS === 'true' ||
  (process.env.REDIS_HOST && process.env.REDIS_HOST.includes('upstash.io'));

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  ...(isTls ? { tls: {} } : {}),
};

console.log('⚡ Starting TripSync Background Worker...');
console.log(`Connecting to Redis at ${connection.host}:${connection.port}`);

const notificationWorker = new Worker(
  'notifications',
  async (job: Job) => {
    console.log(`[Worker] Processing notification job ${job.id} of type: ${job.name}`);
    const { type, recipientEmail, title, message } = job.data;

    switch (type) {
      case 'TRIP_INVITATION':
        console.log(`✉️ Sending trip invitation email to: ${recipientEmail}`);
        console.log(`Subject: ${title}`);
        console.log(`Body: ${message}`);
        break;

      case 'SETTLEMENT_REMINDER':
        console.log(`💰 Sending settlement reminder to: ${recipientEmail}`);
        console.log(`Message: ${message}`);
        break;

      case 'TASK_DUE':
        console.log(`📋 Sending task due notification to: ${recipientEmail}`);
        break;

      default:
        console.log(`ℹ️ Generic notification processed for: ${recipientEmail}`);
    }

    return { processed: true, timestamp: new Date().toISOString() };
  },
  { connection }
);

notificationWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('✨ TripSync BullMQ Worker is ready and listening for jobs.');
