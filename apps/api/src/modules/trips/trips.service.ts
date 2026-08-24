import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { CreateTripInput, UpdateTripInput } from '@tripsync/validation';
import { Trip, TripRole, TripStatus, TripPrivacy } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { trips, tripMembers, profiles, activities } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_TRIP_2_ID, SEED_USERS } from '../../database/seed';

@Injectable()
export class TripsService {
  // In-memory cache for development/mock mode
  private mockTrips: Map<string, any> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    this.initMockTrips();
  }

  private initMockTrips() {
    this.mockTrips.set(SEED_TRIP_ID, {
      id: SEED_TRIP_ID,
      name: 'Darjeeling Himalayan Adventure',
      description: '4-day scenic mountain getaway featuring tea garden trails, Tiger Hill sunrise, and toy train ride.',
      destination: 'Darjeeling, West Bengal, India',
      startDate: '2026-09-10',
      endDate: '2026-09-14',
      budget: 35000,
      currency: 'INR',
      coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      privacy: TripPrivacy.SHARED,
      status: TripStatus.PLANNING,
      ownerId: SEED_USERS[0].id,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
      memberCount: 6,
      totalExpenses: 11600,
    });

    this.mockTrips.set(SEED_TRIP_2_ID, {
      id: SEED_TRIP_2_ID,
      name: 'Goa Coastal Monsoon Retreat',
      description: 'Chilled weekend trip with beach hopping, sunset cruises, and seafood feast.',
      destination: 'North Goa, India',
      startDate: '2026-10-02',
      endDate: '2026-10-06',
      budget: 45000,
      currency: 'INR',
      coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
      privacy: TripPrivacy.PRIVATE,
      status: TripStatus.PLANNING,
      ownerId: SEED_USERS[1].id,
      createdAt: '2026-08-05T00:00:00Z',
      updatedAt: '2026-08-05T00:00:00Z',
      memberCount: 4,
      totalExpenses: 0,
    });
  }

  async getAllTrips(userId: string) {
    if (this.db) {
      try {
        const result = await this.db.query.trips.findMany({
          orderBy: [desc(trips.createdAt)],
          with: {
            members: { with: { user: true } },
            expenses: true,
          },
        });
        return result.map((t) => ({
          ...t,
          budget: t.budget ? Number(t.budget) : null,
          memberCount: t.members.length,
          totalExpenses: t.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        }));
      } catch (err) {
        console.warn('Trips db error, falling back to mock trips');
      }
    }
    return Array.from(this.mockTrips.values());
  }

  async getTripById(tripId: string, userId: string) {
    if (this.db) {
      try {
        const trip = await this.db.query.trips.findFirst({
          where: eq(trips.id, tripId),
          with: {
            owner: true,
            members: { with: { user: true } },
            days: {
              with: {
                activities: {
                  with: { responsibleMember: true },
                  orderBy: [desc(activities.sortOrder)],
                },
              },
            },
            expenses: {
              with: { paidBy: true, participants: { with: { user: true } } },
            },
            tasks: { with: { assignedTo: true } },
            emergencyContacts: true,
          },
        });
        if (trip) return trip;
      } catch (err) {
        console.warn('Trips db error, falling back to mock trip');
      }
    }

    const trip = this.mockTrips.get(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }
    return trip;
  }

  async createTrip(userId: string, input: CreateTripInput) {
    const newTripId = 'trip-' + Date.now();
    const tripData = {
      id: newTripId,
      ...input,
      budget: input.budget || null,
      status: TripStatus.PLANNING,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberCount: 1,
      totalExpenses: 0,
    };

    if (this.db) {
      try {
        const [inserted] = await (this.db.insert(trips).values({
          name: input.name,
          description: input.description,
          destination: input.destination,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget ? input.budget.toString() : null,
          currency: input.currency,
          coverImage: input.coverImage,
          privacy: input.privacy,
          status: TripStatus.PLANNING,
          ownerId: userId,
        } as any) as any).returning();

        // Add creator as OWNER in trip_members
        await (this.db.insert(tripMembers).values({
          tripId: inserted.id,
          userId: userId,
          role: TripRole.OWNER,
        } as any) as any);

        return inserted;
      } catch (err) {
        console.warn('Error inserting trip in db:', err);
      }
    }

    this.mockTrips.set(newTripId, tripData);
    return tripData;
  }

  async updateTrip(tripId: string, input: UpdateTripInput) {
    if (this.db) {
      try {
        const [updated] = await (this.db.update(trips)
          .set({
            ...input,
            budget: input.budget !== undefined ? (input.budget ? input.budget.toString() : null) : undefined,
            updatedAt: new Date(),
          } as any) as any)
          .where(eq(trips.id, tripId))
          .returning();
        if (updated) return updated;
      } catch (err) {
        console.warn('Error updating trip in db:', err);
      }
    }

    const existing = this.mockTrips.get(tripId);
    if (!existing) throw new NotFoundException(`Trip not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.mockTrips.set(tripId, updated);
    return updated;
  }

  async deleteTrip(tripId: string) {
    if (this.db) {
      try {
        await this.db.delete(trips).where(eq(trips.id, tripId));
        return { success: true };
      } catch (err) {
        console.warn('Error deleting trip in db:', err);
      }
    }
    this.mockTrips.delete(tripId);
    return { success: true };
  }
}
