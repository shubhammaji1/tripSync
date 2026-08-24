import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import {
  CreateTripDayInput,
  CreateActivityInput,
  UpdateActivityInput,
  ReorderActivitiesInput,
} from '@tripsync/validation';
import { ActivityStatus } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripDays, activities } from '../../database/schema';
import { eq, and, asc } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

@Injectable()
export class ItineraryService {
  private mockDays: Map<string, any[]> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    this.initMockItinerary();
  }

  private initMockItinerary() {
    this.mockDays.set(SEED_TRIP_ID, [
      {
        id: 'day-1',
        tripId: SEED_TRIP_ID,
        dayNumber: 1,
        date: '2026-09-10',
        title: 'Arrival & Mall Road Stroll',
        notes: 'Check-in and evening walk',
        activities: [
          {
            id: 'act-1',
            dayId: 'day-1',
            tripId: SEED_TRIP_ID,
            title: 'Check-in at Summit Hermon Hotel',
            description: 'Drop bags, freshen up, and meet in the lobby.',
            startTime: '14:00',
            endTime: '15:30',
            locationName: 'Summit Hermon Hotel, Darjeeling',
            locationLat: 27.041,
            locationLng: 88.2663,
            estimatedCost: 6000,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[1].id,
            responsibleMember: SEED_USERS[1],
            status: ActivityStatus.COMPLETED,
            sortOrder: 1,
          },
          {
            id: 'act-2',
            dayId: 'day-1',
            tripId: SEED_TRIP_ID,
            title: 'Mall Road & Chowrasta Evening Walk',
            description: 'Explore souvenir shops, tea lounges, and street momos.',
            startTime: '16:30',
            endTime: '19:30',
            locationName: 'Chowrasta Mall Road',
            locationLat: 27.0435,
            locationLng: 88.268,
            estimatedCost: 1500,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[2].id,
            responsibleMember: SEED_USERS[2],
            status: ActivityStatus.PLANNED,
            sortOrder: 2,
          },
        ],
      },
      {
        id: 'day-2',
        tripId: SEED_TRIP_ID,
        dayNumber: 2,
        date: '2026-09-11',
        title: 'Tiger Hill Sunrise & Tea Gardens',
        notes: 'Early morning sunrise call at 3:30 AM',
        activities: [
          {
            id: 'act-3',
            dayId: 'day-2',
            tripId: SEED_TRIP_ID,
            title: 'Tiger Hill Early Morning Sunrise',
            description: 'Wake up call at 3:30 AM. Witness Kanchenjunga peak glow in golden sunrise.',
            startTime: '04:30',
            endTime: '07:30',
            locationName: 'Tiger Hill, Darjeeling',
            locationLat: 26.9953,
            locationLng: 88.2863,
            estimatedCost: 2400,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[0].id,
            responsibleMember: SEED_USERS[0],
            status: ActivityStatus.PLANNED,
            sortOrder: 1,
          },
          {
            id: 'act-4',
            dayId: 'day-2',
            tripId: SEED_TRIP_ID,
            title: 'Happy Valley Tea Estate Tour & Tasting',
            description: 'Guided tour of historical tea processing factory and first flush tea tasting.',
            startTime: '10:30',
            endTime: '13:00',
            locationName: 'Happy Valley Tea Estate',
            locationLat: 27.054,
            locationLng: 88.261,
            estimatedCost: 1200,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[3].id,
            responsibleMember: SEED_USERS[3],
            status: ActivityStatus.PLANNED,
            sortOrder: 2,
          },
        ],
      },
      {
        id: 'day-3',
        tripId: SEED_TRIP_ID,
        dayNumber: 3,
        date: '2026-09-12',
        title: 'Monasteries & Himalayan Zoo',
        notes: 'Sightseeing day',
        activities: [
          {
            id: 'act-5',
            dayId: 'day-3',
            tripId: SEED_TRIP_ID,
            title: 'Ghoom Monastery (Yiga Choeling)',
            description: 'Visit the oldest Tibetan Buddhist monastery in Darjeeling and see the 15-foot Maitreya Buddha.',
            startTime: '09:30',
            endTime: '11:30',
            locationName: 'Ghoom Monastery',
            locationLat: 27.0142,
            locationLng: 88.2577,
            estimatedCost: 300,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[4].id,
            responsibleMember: SEED_USERS[4],
            status: ActivityStatus.PLANNED,
            sortOrder: 1,
          },
        ],
      },
      {
        id: 'day-4',
        tripId: SEED_TRIP_ID,
        dayNumber: 4,
        date: '2026-09-13',
        title: 'Toy Train Ride & Departure',
        notes: 'Final day and airport drop',
        activities: [
          {
            id: 'act-6',
            dayId: 'day-4',
            tripId: SEED_TRIP_ID,
            title: 'Darjeeling Himalayan Railway Joyride',
            description: 'Steam heritage train joyride from Darjeeling to Ghum and back via Batasia Loop.',
            startTime: '10:00',
            endTime: '12:00',
            locationName: 'Darjeeling Railway Station',
            locationLat: 27.042,
            locationLng: 88.265,
            estimatedCost: 3600,
            currency: 'INR',
            responsibleMemberId: SEED_USERS[0].id,
            responsibleMember: SEED_USERS[0],
            status: ActivityStatus.PLANNED,
            sortOrder: 1,
          },
        ],
      },
    ]);
  }

  async getItinerary(tripId: string) {
    if (this.db) {
      try {
        const days = await this.db.query.tripDays.findMany({
          where: eq(tripDays.tripId, tripId),
          orderBy: [asc(tripDays.dayNumber)],
          with: {
            activities: {
              with: { responsibleMember: true },
              orderBy: [asc(activities.sortOrder)],
            },
          },
        });
        if (days && days.length > 0) return days;
      } catch (err) {
        console.warn('Itinerary query fallback to mock days:', err);
      }
    }

    return this.mockDays.get(tripId) || [];
  }

  async createDay(tripId: string, input: CreateTripDayInput) {
    if (this.db) {
      try {
        const [day] = await (this.db.insert(tripDays).values({
          tripId,
          dayNumber: input.dayNumber,
          date: input.date,
          title: input.title || `Day ${input.dayNumber}`,
          notes: input.notes,
        } as any) as any).returning();
        return day;
      } catch (err) {
        console.warn('Trip day insert db error:', err);
      }
    }

    const day = {
      id: `day-${Date.now()}`,
      tripId,
      dayNumber: input.dayNumber,
      date: input.date,
      title: input.title || `Day ${input.dayNumber}`,
      notes: input.notes || null,
      activities: [],
    };
    const days = this.mockDays.get(tripId) || [];
    days.push(day);
    this.mockDays.set(tripId, days);
    return day;
  }

  async deleteDay(tripId: string, dayId: string) {
    if (this.db) {
      try {
        await this.db.delete(tripDays).where(and(eq(tripDays.id, dayId), eq(tripDays.tripId, tripId)));
        return { success: true };
      } catch (err) {
        console.warn('Trip day delete db error:', err);
      }
    }

    const days = this.mockDays.get(tripId) || [];
    this.mockDays.set(tripId, days.filter((day) => day.id !== dayId));
    return { success: true };
  }

  async createActivity(tripId: string, input: CreateActivityInput) {
    if (this.db) {
      try {
        const [activity] = await (this.db.insert(activities).values({
          tripId,
          dayId: input.dayId,
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          locationName: input.locationName,
          locationLat: input.locationLat,
          locationLng: input.locationLng,
          estimatedCost: input.estimatedCost ? input.estimatedCost.toString() : null,
          currency: input.currency,
          responsibleMemberId: input.responsibleMemberId,
          status: input.status,
          sortOrder: input.sortOrder || 0,
        } as any) as any).returning();
        return activity;
      } catch (err) {
        console.warn('Activity insert db error:', err);
      }
    }

    const newAct = {
      id: 'act-' + Date.now(),
      tripId,
      ...input,
      responsibleMember: SEED_USERS.find((u) => u.id === input.responsibleMemberId) || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const days = this.mockDays.get(tripId) || [];
    const day = days.find((d) => d.id === input.dayId);
    if (day) {
      day.activities = day.activities || [];
      day.activities.push(newAct);
    }
    return newAct;
  }

  async updateActivity(activityId: string, input: UpdateActivityInput) {
    if (this.db) {
      try {
        const [updated] = await (this.db.update(activities)
          .set({
            ...input,
            estimatedCost: input.estimatedCost !== undefined ? (input.estimatedCost ? input.estimatedCost.toString() : null) : undefined,
            updatedAt: new Date(),
          } as any) as any)
          .where(eq(activities.id, activityId))
          .returning();
        return updated;
      } catch (err) {
        console.warn('Activity update db error:', err);
      }
    }

    return { id: activityId, ...input, updatedAt: new Date().toISOString() };
  }

  async deleteActivity(activityId: string) {
    if (this.db) {
      try {
        await this.db.delete(activities).where(eq(activities.id, activityId));
        return { success: true };
      } catch (err) {
        console.warn('Activity delete db error:', err);
      }
    }

    return { success: true };
  }
}
