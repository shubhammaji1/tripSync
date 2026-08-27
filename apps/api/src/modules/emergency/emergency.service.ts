import { Injectable, Inject, Optional, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from '@tripsync/validation';
import { TripRole } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { emergencyContacts, trips, tripMembers } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { SEED_TRIP_ID } from '../../database/seed';

@Injectable()
export class EmergencyService {
  private mockContacts: Map<string, any[]> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    this.initMockContacts();
  }

  private initMockContacts() {
    this.mockContacts.set(SEED_TRIP_ID, [
      {
        id: 'em-1',
        tripId: SEED_TRIP_ID,
        name: 'Darjeeling Sadar District Hospital',
        relationship: 'Primary Hospital & 24x7 Ambulance',
        phone: '+91 354 225 2218',
        altPhone: '108',
        notes: 'Emergency casualty ward, blood bank, and trauma center near Mall Road.',
        isPrimary: true,
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'em-2',
        tripId: SEED_TRIP_ID,
        name: 'Tourist Police Help Desk & Chowrasta Police Station',
        relationship: 'Local Police & Mountain Rescue',
        phone: '+91 354 225 4422',
        altPhone: '112',
        notes: 'Assistance booth at Chowrasta Mall, handles lost documents & mountain safety.',
        isPrimary: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'em-3',
        tripId: SEED_TRIP_ID,
        name: 'Summit Hermon Hotel Front Desk / Manager',
        relationship: 'Accommodation Host',
        phone: '+91 354 225 6789',
        altPhone: '+91 98320 12345',
        notes: 'Booking ID: SH-2026-DARJ-8941. Contact Mr. Thapa (General Manager).',
        isPrimary: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'em-4',
        tripId: SEED_TRIP_ID,
        name: 'Emergency Travel Insurance (Bajaj Allianz)',
        relationship: 'Group Travel Policy',
        phone: '+91 1800 209 5858',
        altPhone: 'Policy #BA-TRIP-998822',
        notes: 'Emergency medical evacuation & accidental cover active for all travelers.',
        isPrimary: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
    ]);
  }

  private async requireManager(tripId: string, userId: string): Promise<void> {
    if (!this.db || !userId) return;
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
    });
    if (trip && trip.ownerId === userId) {
      return;
    }
    const membership = await this.db.query.tripMembers.findFirst({
      where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
    });
    if (!membership || ![TripRole.OWNER, TripRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Only trip owners and admins can manage emergency contacts');
    }
  }

  async getEmergencyContacts(tripId: string) {
    if (this.db) {
      try {
        const result = await this.db.query.emergencyContacts.findMany({
          where: eq(emergencyContacts.tripId, tripId),
        });
        return result;
      } catch (err) {
        throw err;
      }
    }

    return this.mockContacts.get(tripId) || [];
  }

  /**
   * Generates a lightweight, high-reliability offline emergency packet
   * containing critical contacts, member phone numbers, hotel address, and basic details.
   */
  async getEmergencyPacket(tripId: string) {
    const contacts = await this.getEmergencyContacts(tripId);
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: { with: { user: true } } },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
      return {
        tripId,
        tripName: trip.name,
        destination: trip.destination,
        emergencyContacts: contacts,
        members: (trip.members || []).map((member) => ({
          name: member.user?.fullName || member.user?.email || 'Traveler',
          phone: member.user?.phone || 'Not provided',
          email: member.user?.email || '',
        })),
        timestamp: new Date().toISOString(),
        cachedAt: Date.now(),
      };
    }

    return {
      tripId,
      tripName: 'Group Expedition',
      destination: 'Travel Destination',
      emergencyContacts: contacts,
      members: [],
      timestamp: new Date().toISOString(),
      cachedAt: Date.now(),
    };
  }

  async createEmergencyContact(tripId: string, userId: string, input: CreateEmergencyContactInput) {
    await this.requireManager(tripId, userId);

    if (this.db) {
      try {
        if (input.isPrimary) {
          await this.db
            .update(emergencyContacts)
            .set({ isPrimary: false } as any)
            .where(eq(emergencyContacts.tripId, tripId));
        }

        const [contact] = await (this.db.insert(emergencyContacts).values({
          tripId,
          name: input.name,
          relationship: input.relationship,
          phone: input.phone,
          altPhone: input.altPhone,
          notes: input.notes,
          isPrimary: Boolean(input.isPrimary),
        } as any) as any).returning();
        return contact;
      } catch (err) {
        throw err;
      }
    }

    const newContact = {
      id: 'em-' + Date.now(),
      tripId,
      ...input,
      createdAt: new Date().toISOString(),
    };

    const contacts = this.mockContacts.get(tripId) || [];
    if (input.isPrimary) {
      contacts.forEach((c) => (c.isPrimary = false));
    }
    contacts.push(newContact);
    this.mockContacts.set(tripId, contacts);

    return newContact;
  }

  async updateEmergencyContact(
    tripId: string,
    contactId: string,
    userId: string,
    input: UpdateEmergencyContactInput
  ) {
    await this.requireManager(tripId, userId);

    if (this.db) {
      try {
        if (input.isPrimary) {
          await this.db
            .update(emergencyContacts)
            .set({ isPrimary: false } as any)
            .where(eq(emergencyContacts.tripId, tripId));
        }

        const [updated] = await (this.db
          .update(emergencyContacts)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.relationship !== undefined ? { relationship: input.relationship } : {}),
            ...(input.phone !== undefined ? { phone: input.phone } : {}),
            ...(input.altPhone !== undefined ? { altPhone: input.altPhone } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
          } as any)
          .where(and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.tripId, tripId))) as any).returning();

        if (!updated) {
          throw new NotFoundException(`Emergency contact ${contactId} not found`);
        }
        return updated;
      } catch (err) {
        throw err;
      }
    }

    const contacts = this.mockContacts.get(tripId) || [];
    const idx = contacts.findIndex((c) => c.id === contactId);
    if (idx === -1) {
      throw new NotFoundException(`Emergency contact ${contactId} not found`);
    }

    if (input.isPrimary) {
      contacts.forEach((c) => (c.isPrimary = false));
    }
    contacts[idx] = { ...contacts[idx], ...input };
    this.mockContacts.set(tripId, contacts);
    return contacts[idx];
  }

  async deleteEmergencyContact(tripId: string, contactId: string, userId: string) {
    await this.requireManager(tripId, userId);

    if (this.db) {
      try {
        await this.db
          .delete(emergencyContacts)
          .where(and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.tripId, tripId)));
        return { success: true, message: 'Emergency contact deleted' };
      } catch (err) {
        throw err;
      }
    }

    const contacts = this.mockContacts.get(tripId) || [];
    this.mockContacts.set(tripId, contacts.filter((c) => c.id !== contactId));
    return { success: true, message: 'Emergency contact deleted' };
  }

  async seedDefaultContacts(tripId: string, userId: string) {
    await this.requireManager(tripId, userId);

    let destination = 'Local Destination';
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
      });
      if (trip && trip.destination) {
        destination = trip.destination;
      }
    }

    const defaults: CreateEmergencyContactInput[] = [
      {
        name: `${destination} Central Emergency Hospital`,
        relationship: 'Primary 24/7 Hospital & Ambulance',
        phone: '+91 108',
        altPhone: '112',
        notes: `Main emergency casualty ward & ambulance dispatch for ${destination}.`,
        isPrimary: true,
      },
      {
        name: `${destination} Tourist Police Station`,
        relationship: 'Local Police & Rescue Help Desk',
        phone: '+91 112',
        altPhone: '100',
        notes: `Tourist assistance booth, lost documents & safety desk in ${destination}.`,
        isPrimary: false,
      },
      {
        name: 'Group Accommodation Front Desk',
        relationship: 'Hotel / Resort Management',
        phone: '+91 98765 43210',
        altPhone: 'Room Service Ext. 0',
        notes: 'Hotel front desk, emergency night manager & local transport coordinator.',
        isPrimary: false,
      },
      {
        name: 'Group Travel Insurance Hotline',
        relationship: 'Emergency Medical & Travel Evacuation',
        phone: '+91 1800 209 5858',
        altPhone: 'Policy #TRIP-SAFE-2026',
        notes: '24/7 cashless hospitalization & emergency evacuation claim assistance.',
        isPrimary: false,
      },
    ];

    const results = [];
    for (const item of defaults) {
      const created = await this.createEmergencyContact(tripId, userId, item);
      results.push(created);
    }
    return results;
  }
}
