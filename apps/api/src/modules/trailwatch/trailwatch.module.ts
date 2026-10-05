import { Module } from '@nestjs/common';
import { TrailWatchController } from './trailwatch.controller';
import { TrailWatchService } from './trailwatch.service';
import { ItineraryModule } from '../itinerary/itinerary.module';

@Module({
  imports: [ItineraryModule],
  controllers: [TrailWatchController],
  providers: [TrailWatchService],
  exports: [TrailWatchService],
})
export class TrailWatchModule {}
