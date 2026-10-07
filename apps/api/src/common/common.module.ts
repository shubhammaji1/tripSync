import { Global, Module } from '@nestjs/common';
import { ProfileSyncService } from './profile-sync.service';
import { TripAccessService } from './trip-access.service';
import { AuthGuard } from './auth.guard';
import { NotificationQueueService } from './notification-queue.service';

@Global()
@Module({
  providers: [ProfileSyncService, TripAccessService, AuthGuard, NotificationQueueService],
  exports: [ProfileSyncService, TripAccessService, AuthGuard, NotificationQueueService],
})
export class CommonModule {}
