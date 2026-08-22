import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ExpensesModule } from '../expenses/expenses.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { TripsModule } from '../trips/trips.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [ExpensesModule, SettlementsModule, TripsModule, MembersModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
