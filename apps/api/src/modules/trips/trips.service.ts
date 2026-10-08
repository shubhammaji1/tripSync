import { Injectable, Inject, Optional, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTripInput, UpdateTripInput } from '@tripsync/validation';
import { Trip, TripRole, TripStatus, TripPrivacy } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { settlements, expenses, trips, tripMembers, profiles, activities } from '../../database/schema';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_TRIP_2_ID, SEED_USERS } from '../../database/seed';

import { sanitizeHtml } from '@tripsync/validation';

@Injectable()
export class TripsService {
  // In-memory cache for development/mock mode
  private mockTrips: Map<string, any> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    if (!this.db && process.env.NODE_ENV !== 'test') throw new Error('Database persistence is required; sample data is only available in tests');
    if (!this.db) this.initMockTrips();
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
          where: or(eq(trips.ownerId, userId), inArray(trips.id, this.db.select({ tripId: tripMembers.tripId }).from(tripMembers).where(eq(tripMembers.userId, userId)))),
          orderBy: [desc(trips.createdAt)],
          with: {
            members: { with: { user: true } },
            expenses: true,
          },
        });

        // Strictly filter to trips where the user is either the trip creator/owner or an invited active member
        const userTrips = result.filter((t) => {
          const isOwner = t.ownerId === userId;
          const isMember = (t.members || []).some((m: any) => m.userId === userId);
          return isOwner || isMember;
        });

        return userTrips.map((t) => {
          const isOwner = t.ownerId === userId;
          const userMember = (t.members || []).find((m: any) => m.userId === userId);
          const currentUserRole = isOwner ? TripRole.OWNER : (userMember?.role || TripRole.MEMBER);
          return {
            ...t,
            budget: t.budget ? Number(t.budget) : null,
            memberCount: t.members.length,
            totalExpenses: t.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
            role: currentUserRole,
            isOwner,
          };
        });
      } catch (err) {
        throw err;
      }
    }
    return Array.from(this.mockTrips.values())
      .filter((t) => t.ownerId === userId)
      .map((t) => ({
        ...t,
        role: TripRole.OWNER,
        isOwner: true,
      }));
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

        if (!trip) {
          throw new NotFoundException(`Trip with ID ${tripId} not found`);
        }

        // Enforce object-level access control for private trips (BUG-002)
        if (trip) {
          const isOwner = trip.ownerId === userId;
          const isMember = (trip.members || []).some((m: any) => m.userId === userId);
          if (!isOwner && !isMember) {
            throw new ForbiddenException('You do not have access to this private trip');
          }
        }

        const mappedMembers = (trip.members || []).map((m: any) => {
          if (m.userId === trip.ownerId) {
            return { ...m, role: TripRole.OWNER };
          }
          return m;
        });
        const hasOwner = mappedMembers.some((m: any) => m.userId === trip.ownerId);
        if (!hasOwner && trip.owner) {
          mappedMembers.unshift({
            tripId: trip.id,
            userId: trip.ownerId,
            role: TripRole.OWNER,
            joinedAt: trip.createdAt,
            user: trip.owner,
          } as any);
        }
        return {
          ...trip,
          members: mappedMembers,
        };
      } catch (err) {
        throw err;
      }
    }

    const trip = this.mockTrips.get(tripId);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }
    if (trip.privacy === TripPrivacy.PRIVATE && trip.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this private trip');
    }
    return trip;
  }

  async createTrip(userId: string, input: CreateTripInput) {
    const sanitizedName = sanitizeHtml(input.name);
    const sanitizedDesc = input.description ? sanitizeHtml(input.description) : null;

    const newTripId = 'trip-' + Date.now();
    const tripData = {
      id: newTripId,
      ...input,
      name: sanitizedName,
      description: sanitizedDesc,
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
        const inserted = await this.db.transaction(async tx => {
        const [inserted] = await (tx.insert(trips).values({
          name: sanitizedName,
          description: sanitizedDesc,
          destination: input.destination,
          destinationLat: input.destinationLat,
          destinationLng: input.destinationLng,
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
        await (tx.insert(tripMembers).values({
          tripId: inserted.id,
          userId: userId,
          role: TripRole.OWNER,
        } as any) as any);
        return inserted;
        });

        return {
          ...inserted,
          budget: inserted.budget ? Number(inserted.budget) : null,
          memberCount: 1,
          totalExpenses: 0,
        };
      } catch (err) {
        throw err;
      }
    }

    this.mockTrips.set(newTripId, tripData);
    return tripData;
  }

  private async requireTripManager(tripId: string, userId: string) {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
      });
      if (!trip) throw new NotFoundException('Trip not found');
      if (trip.ownerId === userId) return trip;

      const membership = await this.db.query.tripMembers.findFirst({
        where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
      });
      if (!membership || ![TripRole.OWNER, TripRole.ADMIN].includes(membership.role)) {
        throw new ForbiddenException('Only trip owners and admins can update trip details');
      }
      return trip;
    }
    const mock = this.mockTrips.get(tripId);
    if (!mock) throw new NotFoundException('Trip not found');
    if (mock.ownerId !== userId) {
      throw new ForbiddenException('Only trip owners and admins can update trip details');
    }
    return mock;
  }

  private async requireTripOwner(tripId: string, userId: string) {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
      });
      if (!trip) throw new NotFoundException('Trip not found');
      if (trip.ownerId !== userId) {
        throw new ForbiddenException('Only the trip creator and owner can delete this trip');
      }
      return trip;
    }
    const mock = this.mockTrips.get(tripId);
    if (!mock) throw new NotFoundException('Trip not found');
    if (mock.ownerId !== userId) {
      throw new ForbiddenException('Only the trip creator and owner can delete this trip');
    }
    return mock;
  }

  async updateTrip(tripId: string, userId: string, input: UpdateTripInput) {
    const currentTrip = await this.requireTripManager(tripId, userId);
    if (input.destination !== undefined && input.destination !== currentTrip.destination && input.destinationLat === undefined) {
      input = { ...input, destinationLat: null, destinationLng: null };
    }
    if (input.currency && input.currency !== currentTrip.currency && this.db) {
      const ledger = await this.db.query.expenses.findFirst({ where: eq(expenses.tripId, tripId) });
      const paid = await this.db.query.settlements.findFirst({ where: eq(settlements.tripId, tripId) });
      if (ledger || paid) throw new ForbiddenException('Trip currency cannot change after recording expenses or settlements');
    }

    const sanitizedData = {
      ...input,
      name: input.name !== undefined ? sanitizeHtml(input.name) : undefined,
      description: input.description !== undefined ? (input.description ? sanitizeHtml(input.description) : null) : undefined,
    };

    if (this.db) {
      try {
        const [updated] = await (this.db.update(trips)
          .set({
            ...sanitizedData,
            budget: input.budget !== undefined ? (input.budget ? input.budget.toString() : null) : undefined,
            updatedAt: new Date(),
          } as any) as any)
          .where(eq(trips.id, tripId))
          .returning();
        if (updated) return updated;
      } catch (err) {
        throw err;
      }
    }

    const existing = this.mockTrips.get(tripId);
    if (!existing) throw new NotFoundException(`Trip not found`);
    const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.mockTrips.set(tripId, updated);
    return updated;
  }

  async deleteTrip(tripId: string, userId: string) {
    await this.requireTripOwner(tripId, userId);

    if (this.db) {
      try {
        await this.db.delete(trips).where(eq(trips.id, tripId));
        return { success: true };
      } catch (err) {
        throw err;
      }
    }
    this.mockTrips.delete(tripId);
    return { success: true };
  }
}
