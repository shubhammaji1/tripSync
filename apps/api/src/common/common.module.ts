import { Global, Module } from '@nestjs/common';
import { ProfileSyncService } from './profile-sync.service';

@Global()
@Module({
  providers: [ProfileSyncService],
  exports: [ProfileSyncService],
})
export class CommonModule {}
