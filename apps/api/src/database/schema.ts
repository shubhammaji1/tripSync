import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  doublePrecision,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  TripRole,
  TripPrivacy,
  TripStatus,
  InvitationStatus,
  ActivityStatus,
  ExpenseCategory,
  SplitType,
  SettlementStatus,
  TaskPriority,
  TaskStatus,
  NotificationType,
} from '@tripsync/types';

// ==========================================
// Enums in Postgres
// ==========================================
export const tripRoleEnum = pgEnum('trip_role', [
  TripRole.OWNER,
  TripRole.ADMIN,
  TripRole.MEMBER,
  TripRole.VIEWER,
]);

export const tripPrivacyEnum = pgEnum('trip_privacy', [
  TripPrivacy.PRIVATE,
  TripPrivacy.SHARED,
  TripPrivacy.PUBLIC,
]);

export const tripStatusEnum = pgEnum('trip_status', [
  TripStatus.PLANNING,
  TripStatus.ACTIVE,
  TripStatus.COMPLETED,
  TripStatus.ARCHIVED,
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
  InvitationStatus.DECLINED,
  InvitationStatus.EXPIRED,
]);

export const activityStatusEnum = pgEnum('activity_status', [
  ActivityStatus.PLANNED,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.COMPLETED,
  ActivityStatus.CANCELLED,
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  ExpenseCategory.ACCOMMODATION,
  ExpenseCategory.TRANSPORT,
  ExpenseCategory.FOOD,
  ExpenseCategory.ACTIVITIES,
  ExpenseCategory.SHOPPING,
  ExpenseCategory.ENTERTAINMENT,
  ExpenseCategory.EMERGENCY,
  ExpenseCategory.OTHER,
]);

export const splitTypeEnum = pgEnum('split_type', [
  SplitType.EQUAL,
  SplitType.EXACT,
  SplitType.PERCENTAGE,
  SplitType.SHARES,
]);

export const settlementStatusEnum = pgEnum('settlement_status', [
  SettlementStatus.PENDING,
  SettlementStatus.SETTLED,
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
]);

export const taskStatusEnum = pgEnum('task_status', [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  NotificationType.TRIP_INVITATION,
  NotificationType.ITINERARY_UPDATED,
  NotificationType.EXPENSE_ADDED,
  NotificationType.SETTLEMENT_REMINDER,
  NotificationType.TASK_ASSIGNED,
  NotificationType.EMERGENCY_TRIGGERED,
  NotificationType.SYSTEM,
]);

// ==========================================
// 1. Profiles Table
// ==========================================
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // maps to auth.users.id
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. Trips Table
// ==========================================
export const trips = pgTable(
  'trips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    destination: text('destination').notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    budget: numeric('budget', { precision: 12, scale: 2 }),
    currency: text('currency').default('INR').notNull(),
    coverImage: text('cover_image'),
    privacy: tripPrivacyEnum('privacy').default(TripPrivacy.PRIVATE).notNull(),
    status: tripStatusEnum('status').default(TripStatus.PLANNING).notNull(),
    ownerId: uuid('owner_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('trips_owner_idx').on(table.ownerId),
    statusIdx: index('trips_status_idx').on(table.status),
  })
);

// ==========================================
// 3. Trip Members Table
// ==========================================
export const tripMembers = pgTable(
  'trip_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    role: tripRoleEnum('role').default(TripRole.MEMBER).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripUserIdx: uniqueIndex('trip_user_idx').on(table.tripId, table.userId),
    tripIdx: index('trip_members_trip_idx').on(table.tripId),
  })
);

// ==========================================
// 4. Trip Invitations Table
// ==========================================
export const tripInvitations = pgTable(
  'trip_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    email: text('email').notNull(),
    token: text('token').notNull().unique(),
    role: tripRoleEnum('role').default(TripRole.MEMBER).notNull(),
    status: invitationStatusEnum('status').default(InvitationStatus.PENDING).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index('invitations_token_idx').on(table.token),
    tripIdx: index('invitations_trip_idx').on(table.tripId),
  })
);

// ==========================================
// 5. Trip Days Table
// ==========================================
export const tripDays = pgTable(
  'trip_days',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    dayNumber: integer('day_number').notNull(),
    date: text('date').notNull(),
    title: text('title'),
    notes: text('notes'),
  },
  (table) => ({
    tripDayIdx: uniqueIndex('trip_day_number_idx').on(table.tripId, table.dayNumber),
  })
);

// ==========================================
// 6. Activities Table
// ==========================================
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dayId: uuid('day_id').references(() => tripDays.id, { onDelete: 'cascade' }).notNull(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    locationName: text('location_name'),
    locationLat: doublePrecision('location_lat'),
    locationLng: doublePrecision('location_lng'),
    estimatedCost: numeric('estimated_cost', { precision: 10, scale: 2 }),
    currency: text('currency').default('INR').notNull(),
    responsibleMemberId: uuid('responsible_member_id').references(() => profiles.id, { onDelete: 'set null' }),
    status: activityStatusEnum('status').default(ActivityStatus.PLANNED).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dayIdx: index('activities_day_idx').on(table.dayId),
    tripIdx: index('activities_trip_idx').on(table.tripId),
  })
);

// ==========================================
// 7. Expenses Table
// ==========================================
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    paidById: uuid('paid_by_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('INR').notNull(),
    category: expenseCategoryEnum('category').default(ExpenseCategory.FOOD).notNull(),
    splitType: splitTypeEnum('split_type').default(SplitType.EQUAL).notNull(),
    date: text('date').notNull(),
    receiptUrl: text('receipt_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripIdx: index('expenses_trip_idx').on(table.tripId),
    paidByIdx: index('expenses_paid_by_idx').on(table.paidById),
  })
);

// ==========================================
// 8. Expense Participants Table
// ==========================================
export const expenseParticipants = pgTable(
  'expense_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    expenseId: uuid('expense_id').references(() => expenses.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    shareAmount: numeric('share_amount', { precision: 12, scale: 2 }).notNull(),
    percentage: doublePrecision('percentage'),
    shares: integer('shares'),
  },
  (table) => ({
    expenseUserIdx: uniqueIndex('expense_participant_user_idx').on(table.expenseId, table.userId),
    expenseIdx: index('expense_participants_expense_idx').on(table.expenseId),
  })
);

// ==========================================
// 9. Settlements Table
// ==========================================
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    fromUserId: uuid('from_user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    toUserId: uuid('to_user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('INR').notNull(),
    status: settlementStatusEnum('status').default(SettlementStatus.PENDING).notNull(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripIdx: index('settlements_trip_idx').on(table.tripId),
    fromUserIdx: index('settlements_from_user_idx').on(table.fromUserId),
    toUserIdx: index('settlements_to_user_idx').on(table.toUserId),
  })
);

// ==========================================
// 10. Tasks Table
// ==========================================
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    assignedToId: uuid('assigned_to_id').references(() => profiles.id, { onDelete: 'set null' }),
    dueDate: text('due_date'),
    priority: taskPriorityEnum('priority').default(TaskPriority.MEDIUM).notNull(),
    status: taskStatusEnum('status').default(TaskStatus.TODO).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripIdx: index('tasks_trip_idx').on(table.tripId),
    assignedIdx: index('tasks_assigned_idx').on(table.assignedToId),
  })
);

// ==========================================
// 11. Emergency Contacts Table
// ==========================================
export const emergencyContacts = pgTable(
  'emergency_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    relationship: text('relationship').notNull(),
    phone: text('phone').notNull(),
    altPhone: text('alt_phone'),
    notes: text('notes'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripIdx: index('emergency_contacts_trip_idx').on(table.tripId),
  })
);

// ==========================================
// 12. Documents Table
// ==========================================
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    fileUrl: text('file_url').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(),
    category: text('category').default('GENERAL').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tripIdx: index('documents_trip_idx').on(table.tripId),
  })
);

// ==========================================
// 13. Notifications Table
// ==========================================
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').default(NotificationType.SYSTEM).notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
  })
);

// ==========================================
// Drizzle Relations
// ==========================================
export const profilesRelations = relations(profiles, ({ many }) => ({
  ownedTrips: many(trips),
  tripMemberships: many(tripMembers),
  expensesPaid: many(expenses),
  expenseShares: many(expenseParticipants),
  assignedTasks: many(tasks),
  notifications: many(notifications),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [trips.ownerId],
    references: [profiles.id],
  }),
  members: many(tripMembers),
  invitations: many(tripInvitations),
  days: many(tripDays),
  activities: many(activities),
  expenses: many(expenses),
  settlements: many(settlements),
  tasks: many(tasks),
  emergencyContacts: many(emergencyContacts),
  documents: many(documents),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
  user: one(profiles, {
    fields: [tripMembers.userId],
    references: [profiles.id],
  }),
}));

export const tripDaysRelations = relations(tripDays, ({ one, many }) => ({
  trip: one(trips, {
    fields: [tripDays.tripId],
    references: [trips.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  day: one(tripDays, {
    fields: [activities.dayId],
    references: [tripDays.id],
  }),
  trip: one(trips, {
    fields: [activities.tripId],
    references: [trips.id],
  }),
  responsibleMember: one(profiles, {
    fields: [activities.responsibleMemberId],
    references: [profiles.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
  paidBy: one(profiles, {
    fields: [expenses.paidById],
    references: [profiles.id],
  }),
  participants: many(expenseParticipants),
}));

export const expenseParticipantsRelations = relations(expenseParticipants, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseParticipants.expenseId],
    references: [expenses.id],
  }),
  user: one(profiles, {
    fields: [expenseParticipants.userId],
    references: [profiles.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  trip: one(trips, {
    fields: [settlements.tripId],
    references: [trips.id],
  }),
  fromUser: one(profiles, {
    fields: [settlements.fromUserId],
    references: [profiles.id],
  }),
  toUser: one(profiles, {
    fields: [settlements.toUserId],
    references: [profiles.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  trip: one(trips, {
    fields: [tasks.tripId],
    references: [trips.id],
  }),
  assignedTo: one(profiles, {
    fields: [tasks.assignedToId],
    references: [profiles.id],
  }),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  trip: one(trips, {
    fields: [emergencyContacts.tripId],
    references: [trips.id],
  }),
}));
