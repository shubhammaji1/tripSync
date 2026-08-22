import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from './schema';
import {
  TripRole,
  TripPrivacy,
  TripStatus,
  ActivityStatus,
  ExpenseCategory,
  SplitType,
  SettlementStatus,
  TaskPriority,
  TaskStatus,
} from '@tripsync/types';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const SEED_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'rahul@tripsync.io',
    fullName: 'Rahul Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43210',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'shubham@tripsync.io',
    fullName: 'Shubham Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43211',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'priya@tripsync.io',
    fullName: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43212',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'amit@tripsync.io',
    fullName: 'Amit Kumar',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43213',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'sneha@tripsync.io',
    fullName: 'Sneha Reddy',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43214',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'arjun@tripsync.io',
    fullName: 'Arjun Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43215',
  },
];

export const SEED_TRIP_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const SEED_TRIP_2_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

export async function seedDatabase() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tripsync';
  console.log('🌱 Seeding database at:', connectionString);
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    // 1. Insert Profiles
    console.log('Inserting profiles...');
    for (const u of SEED_USERS) {
      await (db.insert(schema.profiles).values(u as any) as any).onConflictDoNothing();
    }

    // 2. Insert Main Trip
    console.log('Inserting trips...');
    await (db.insert(schema.trips).values([
      {
        id: SEED_TRIP_ID,
        name: 'Darjeeling Himalayan Adventure',
        description:
          '4-day scenic mountain getaway featuring tea garden trails, Tiger Hill sunrise, toy train ride, and local monastery explorations.',
        destination: 'Darjeeling, West Bengal, India',
        startDate: '2026-09-10',
        endDate: '2026-09-14',
        budget: '35000.00',
        currency: 'INR',
        coverImage:
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
        privacy: TripPrivacy.SHARED,
        status: TripStatus.PLANNING,
        ownerId: SEED_USERS[0].id, // Rahul
      },
      {
        id: SEED_TRIP_2_ID,
        name: 'Goa Coastal Monsoon Retreat',
        description: 'Chilled weekend trip with beach hopping, sunset cruises, and seafood feast.',
        destination: 'North Goa, India',
        startDate: '2026-10-02',
        endDate: '2026-10-06',
        budget: '45000.00',
        currency: 'INR',
        coverImage:
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        privacy: TripPrivacy.PRIVATE,
        status: TripStatus.PLANNING,
        ownerId: SEED_USERS[1].id, // Shubham
      },
    ] as any) as any).onConflictDoNothing();

    // 3. Insert Members
    console.log('Inserting trip members...');
    const memberRoles = [
      { userId: SEED_USERS[0].id, role: TripRole.OWNER },
      { userId: SEED_USERS[1].id, role: TripRole.ADMIN },
      { userId: SEED_USERS[2].id, role: TripRole.MEMBER },
      { userId: SEED_USERS[3].id, role: TripRole.MEMBER },
      { userId: SEED_USERS[4].id, role: TripRole.MEMBER },
      { userId: SEED_USERS[5].id, role: TripRole.MEMBER },
    ];

    for (const m of memberRoles) {
      await (db.insert(schema.tripMembers).values({
        tripId: SEED_TRIP_ID,
        userId: m.userId,
        role: m.role,
      } as any) as any).onConflictDoNothing();
    }

    // 4. Insert Itinerary Days & Activities
    console.log('Inserting itinerary days and activities...');
    const day1Id = 'd1111111-1111-1111-1111-111111111111';
    const day2Id = 'd2222222-2222-2222-2222-222222222222';
    const day3Id = 'd3333333-3333-3333-3333-333333333333';
    const day4Id = 'd4444444-4444-4444-4444-444444444444';

    await (db.insert(schema.tripDays).values([
      { id: day1Id, tripId: SEED_TRIP_ID, dayNumber: 1, date: '2026-09-10', title: 'Arrival & Mall Road Stroll' },
      { id: day2Id, tripId: SEED_TRIP_ID, dayNumber: 2, date: '2026-09-11', title: 'Tiger Hill Sunrise & Tea Gardens' },
      { id: day3Id, tripId: SEED_TRIP_ID, dayNumber: 3, date: '2026-09-12', title: 'Monasteries & Himalayan Zoo' },
      { id: day4Id, tripId: SEED_TRIP_ID, dayNumber: 4, date: '2026-09-13', title: 'Toy Train Ride & Departure' },
    ] as any) as any).onConflictDoNothing();

    await (db.insert(schema.activities).values([
      {
        dayId: day1Id,
        tripId: SEED_TRIP_ID,
        title: 'Check-in at Summit Hermon Hotel',
        description: 'Drop bags, freshen up, and meet in the lobby.',
        startTime: '14:00',
        endTime: '15:30',
        locationName: 'Summit Hermon Hotel, Darjeeling',
        locationLat: 27.041,
        locationLng: 88.2663,
        estimatedCost: '6000.00',
        responsibleMemberId: SEED_USERS[1].id,
        status: ActivityStatus.COMPLETED,
        sortOrder: 1,
      },
      {
        dayId: day1Id,
        tripId: SEED_TRIP_ID,
        title: 'Mall Road & Chowrasta Evening Walk',
        description: 'Explore souvenir shops, tea lounges, and street momos.',
        startTime: '16:30',
        endTime: '19:30',
        locationName: 'Chowrasta Mall Road',
        locationLat: 27.0435,
        locationLng: 88.268,
        estimatedCost: '1500.00',
        responsibleMemberId: SEED_USERS[2].id,
        status: ActivityStatus.PLANNED,
        sortOrder: 2,
      },
      {
        dayId: day2Id,
        tripId: SEED_TRIP_ID,
        title: 'Tiger Hill Early Morning Sunrise',
        description: 'Wake up call at 3:30 AM. Witness Kanchenjunga peak glow in golden sunrise.',
        startTime: '04:30',
        endTime: '07:30',
        locationName: 'Tiger Hill, Darjeeling',
        locationLat: 26.9953,
        locationLng: 88.2863,
        estimatedCost: '2400.00',
        responsibleMemberId: SEED_USERS[0].id,
        status: ActivityStatus.PLANNED,
        sortOrder: 1,
      },
      {
        dayId: day2Id,
        tripId: SEED_TRIP_ID,
        title: 'Happy Valley Tea Estate Tour & Tasting',
        description: 'Guided tour of historical tea processing factory and first flush tea tasting.',
        startTime: '10:30',
        endTime: '13:00',
        locationName: 'Happy Valley Tea Estate',
        locationLat: 27.054,
        locationLng: 88.261,
        estimatedCost: '1200.00',
        responsibleMemberId: SEED_USERS[3].id,
        status: ActivityStatus.PLANNED,
        sortOrder: 2,
      },
    ] as any) as any).onConflictDoNothing();

    // 5. Insert Expenses & Splits
    console.log('Inserting expenses and participants...');
    const exp1Id = 'e1111111-1111-1111-1111-111111111111';
    const exp2Id = 'e2222222-2222-2222-2222-222222222222';
    const exp3Id = 'e3333333-3333-3333-3333-333333333333';

    await (db.insert(schema.expenses).values([
      {
        id: exp1Id,
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[0].id, // Rahul paid ₹6,000 for Hotel
        title: 'Summit Hermon Hotel Advance',
        amount: '6000.00',
        currency: 'INR',
        category: ExpenseCategory.ACCOMMODATION,
        splitType: SplitType.EQUAL,
        date: '2026-09-10',
        notes: 'Room booking for 4 rooms',
      },
      {
        id: exp2Id,
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[1].id, // Shubham paid ₹2,400 for Cab
        title: 'Private Cab for Tiger Hill & Sightseeing',
        amount: '2400.00',
        currency: 'INR',
        category: ExpenseCategory.TRANSPORT,
        splitType: SplitType.EQUAL,
        date: '2026-09-11',
        notes: 'Prepaid Innova driver',
      },
      {
        id: exp3Id,
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[2].id, // Priya paid ₹3,200 for Dinner
        title: 'Glenary’s Bakery & Restaurant Group Dinner',
        amount: '3200.00',
        currency: 'INR',
        category: ExpenseCategory.FOOD,
        splitType: SplitType.EQUAL,
        date: '2026-09-11',
        notes: 'Continental dinner & pastries',
      },
    ] as any) as any).onConflictDoNothing();

    // 6. Insert Tasks
    console.log('Inserting tasks...');
    await (db.insert(schema.tasks).values([
      {
        tripId: SEED_TRIP_ID,
        title: 'Confirm Toyota Innova cab pickup at Bagdogra Airport',
        assignedToId: SEED_USERS[0].id,
        dueDate: '2026-09-09',
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
      },
      {
        tripId: SEED_TRIP_ID,
        title: 'Buy Himalayan Mountaineering Institute museum tickets online',
        assignedToId: SEED_USERS[1].id,
        dueDate: '2026-09-10',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
      },
      {
        tripId: SEED_TRIP_ID,
        title: 'Pack first aid kit with motion sickness & altitude medicines',
        assignedToId: SEED_USERS[2].id,
        dueDate: '2026-09-08',
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
      },
    ] as any) as any).onConflictDoNothing();

    // 7. Insert Emergency Contacts
    console.log('Inserting emergency contacts...');
    await (db.insert(schema.emergencyContacts).values([
      {
        tripId: SEED_TRIP_ID,
        name: 'Darjeeling Sadar District Hospital',
        relationship: 'Local Emergency Hospital',
        phone: '+91 354 225 2218',
        notes: 'Located near Mall Road, 24/7 Casualty & Ambulance available',
        isPrimary: true,
      },
      {
        tripId: SEED_TRIP_ID,
        name: 'Darjeeling Police Station',
        relationship: 'Police Help Desk',
        phone: '+91 354 225 4422',
        notes: 'Tourist Police Assistance Booth at Chowrasta',
        isPrimary: false,
      },
    ] as any) as any).onConflictDoNothing();

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDatabase();
}
