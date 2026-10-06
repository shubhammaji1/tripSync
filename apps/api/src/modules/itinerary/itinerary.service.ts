import { Injectable, Inject, Optional, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  CreateTripDayInput,
  CreateActivityInput,
  UpdateActivityInput,
  ReorderActivitiesInput,
} from '@tripsync/validation';
import { ActivityStatus, TripRole, TripPrivacy } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripDays, activities, trips, tripMembers } from '../../database/schema';
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

  private async verifyTripMember(tripId: string, userId: string): Promise<any> {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: true },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

      const isOwner = trip.ownerId === userId;
      const isMember = (trip.members || []).some((m: any) => m.userId === userId);
      if (!isOwner && !isMember) {
        throw new ForbiddenException('You do not have permission to access the itinerary for this trip');
      }
      return trip;
    }
    return null;
  }

  private async verifyActivityManagePermission(tripId: string, activityId: string, userId: string): Promise<any> {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: true },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

      const activity = await this.db.query.activities.findFirst({
        where: and(eq(activities.id, activityId), eq(activities.tripId, tripId)),
      });
      if (!activity) throw new NotFoundException(`Activity ${activityId} not found`);

      const isOwner = trip.ownerId === userId;
      const memberRole = (trip.members || []).find((m: any) => m.userId === userId)?.role;
      const isAdmin = memberRole === TripRole.ADMIN || memberRole === TripRole.OWNER;
      const isResponsible = activity.responsibleMemberId === userId;

      if (!isOwner && !isAdmin && !isResponsible) {
        throw new ForbiddenException('Only trip managers or activity creators can delete activities');
      }
      return activity;
    }
    return null;
  }

  async getItinerary(tripId: string, userId?: string) {
    if (userId) {
      await this.verifyTripMember(tripId, userId);
    }

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
        return days;
      } catch (err) {
        throw err;
      }
    }

    return this.mockDays.get(tripId) || [];
  }

  async createDay(tripId: string, userId: string, input: CreateTripDayInput) {
    await this.verifyTripMember(tripId, userId);

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
        throw err;
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

  async deleteDay(tripId: string, dayId: string, userId: string) {
    const trip = await this.verifyTripMember(tripId, userId);
    if (this.db && trip) {
      const isOwner = trip.ownerId === userId;
      const memberRole = (trip.members || []).find((m: any) => m.userId === userId)?.role;
      const isAdmin = memberRole === TripRole.ADMIN || memberRole === TripRole.OWNER;
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Only trip managers can delete itinerary days');
      }
    }

    if (this.db) {
      try {
        await this.db.delete(tripDays).where(and(eq(tripDays.id, dayId), eq(tripDays.tripId, tripId)));
        return { success: true };
      } catch (err) {
        throw err;
      }
    }

    const days = this.mockDays.get(tripId) || [];
    this.mockDays.set(tripId, days.filter((day) => day.id !== dayId));
    return { success: true };
  }

  async createActivity(tripId: string, userId: string, input: CreateActivityInput) {
    await this.verifyTripMember(tripId, userId);

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
        throw err;
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

  async updateActivity(tripId: string, activityId: string, userId: string, input: UpdateActivityInput) {
    await this.verifyActivityManagePermission(tripId, activityId, userId);

    if (this.db) {
      try {
        const [updated] = await (this.db.update(activities)
          .set({
            ...input,
            estimatedCost: input.estimatedCost !== undefined ? (input.estimatedCost ? input.estimatedCost.toString() : null) : undefined,
            updatedAt: new Date(),
          } as any) as any)
          .where(and(eq(activities.id, activityId), eq(activities.tripId, tripId)))
          .returning();
        return updated;
      } catch (err) {
        throw err;
      }
    }

    return { id: activityId, ...input, updatedAt: new Date().toISOString() };
  }

  async deleteActivity(tripId: string, activityId: string, userId: string) {
    await this.verifyActivityManagePermission(tripId, activityId, userId);

    if (this.db) {
      try {
        await this.db.delete(activities).where(and(eq(activities.id, activityId), eq(activities.tripId, tripId)));
        return { success: true };
      } catch (err) {
        throw err;
      }
    }

    return { success: true };
  }
}
