import { Injectable, Inject, Optional } from '@nestjs/common';
import { CreateEmergencyContactInput } from '@tripsync/validation';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { emergencyContacts, trips } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

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
        notes: 'Emergency medical evacuation & accidental cover active for all 6 travelers.',
        isPrimary: false,
        createdAt: '2026-08-01T00:00:00Z',
      },
    ]);
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
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: { members: { with: { user: true } } },
    });
    if (!trip) throw new Error(`Trip ${tripId} not found`);
    return {
      tripId,
      tripName: trip.name,
      destination: trip.destination,
      emergencyContacts: contacts,
      members: trip.members.map((member) => ({
        name: member.user.fullName,
        phone: member.user.phone,
        email: member.user.email,
      })),
      timestamp: new Date().toISOString(),
      cachedAt: Date.now(),
    };
  }

  async createEmergencyContact(tripId: string, input: CreateEmergencyContactInput) {
    if (this.db) {
      try {
        const [contact] = await (this.db.insert(emergencyContacts).values({
          tripId,
          name: input.name,
          relationship: input.relationship,
          phone: input.phone,
          altPhone: input.altPhone,
          notes: input.notes,
          isPrimary: input.isPrimary,
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
    contacts.push(newContact);
    this.mockContacts.set(tripId, contacts);

    return newContact;
  }
}
