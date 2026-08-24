import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './modules/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { TripsModule } from './modules/trips/trips.module';
import { MembersModule } from './modules/members/members.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    CommonModule,
    DatabaseModule,
    RealtimeModule,
    AuthModule,
    TripsModule,
    MembersModule,
    ItineraryModule,
    ExpensesModule,
    SettlementsModule,
    TasksModule,
    EmergencyModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}