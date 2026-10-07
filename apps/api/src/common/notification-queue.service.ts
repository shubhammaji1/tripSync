import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationQueueService implements OnModuleDestroy {
  private queue?: Queue;
  constructor() {
    if (process.env.NOTIFICATIONS_USE_QUEUE === 'true') {
      this.queue = new Queue('notifications', { connection: {
        host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined, maxRetriesPerRequest: 1,
        enableOfflineQueue: false, connectTimeout: 5000,
        ...(process.env.REDIS_TLS === 'true' || process.env.REDIS_HOST?.includes('upstash.io') ? { tls: {} } : {}),
      }, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: { age: 30 * 86400 }, removeOnFail: { age: 30 * 86400 } } });
      this.queue.on('error', () => undefined);
    }
  }
  get enabled() { return !!this.queue; }
  async sendInvitation(recipientEmail: string, title: string, message: string) {
    if (!this.queue) throw new ServiceUnavailableException('Notification queue is not configured');
    try { await this.queue.add('invitation', { type: 'TRIP_INVITATION', recipientEmail, title, message }, { jobId: randomUUID() }); }
    catch { throw new ServiceUnavailableException('Invitation saved but email could not be queued. Retry sending from the invitations list.'); }
  }
  async onModuleDestroy() { await this.queue?.close(); }
}
