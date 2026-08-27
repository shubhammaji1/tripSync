import { z } from 'zod';
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

// ==========================================
// Auth Schemas
// ==========================================
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().max(20).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  // Supabase-hosted projects issue a numeric email token. Accept both the
  // six- and eight-digit forms used by different Supabase Auth versions.
  token: z.string().regex(/^\d{6,8}$/, 'Enter the verification code from your email'),
});

export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// ==========================================
// Profile Schemas
// ==========================================
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatarUrl: z.string().url('Must be a valid URL').nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ==========================================
// Trip Schemas
// ==========================================
export const createTripSchema = z.object({
  name: z.string().min(3, 'Trip name must be at least 3 characters').max(120),
  description: z.string().max(1000).nullable().optional(),
  destination: z.string().min(2, 'Destination is required').max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  budget: z.number().positive('Budget must be greater than 0').nullable().optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('INR'),
  coverImage: z.string().url().nullable().optional(),
  privacy: z.nativeEnum(TripPrivacy).default(TripPrivacy.PRIVATE),
});

export const updateTripSchema = createTripSchema.partial().extend({
  status: z.nativeEnum(TripStatus).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

// ==========================================
// Trip Member & Invite Schemas
// ==========================================
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(TripRole).default(TripRole.MEMBER),
});

export const bulkInviteMemberSchema = z.object({
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  role: z.nativeEnum(TripRole).default(TripRole.MEMBER),
});

export const createShareLinkSchema = z.object({
  role: z.nativeEnum(TripRole).default(TripRole.MEMBER).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TripRole),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type BulkInviteMemberInput = z.infer<typeof bulkInviteMemberSchema>;
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// ==========================================
// Itinerary & Activity Schemas
// ==========================================
export const createTripDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  title: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const createActivitySchema = z.object({
  dayId: z.string().uuid('Invalid day ID'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(1000).nullable().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM').nullable().optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM').nullable().optional(),
  locationName: z.string().max(200).nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).default('INR'),
  responsibleMemberId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(ActivityStatus).default(ActivityStatus.PLANNED),
  sortOrder: z.number().int().default(0),
});

export const updateActivitySchema = createActivitySchema.partial();

export const reorderActivitiesSchema = z.object({
  activityIds: z.array(z.string().uuid()),
});

export type CreateTripDayInput = z.infer<typeof createTripDaySchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ReorderActivitiesInput = z.infer<typeof reorderActivitiesSchema>;

// ==========================================
// Expense & Settlement Schemas
// ==========================================
export const expenseParticipantSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  shareAmount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  shares: z.number().int().positive().nullable().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().min(2, 'Title required').max(150),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('INR'),
  category: z.nativeEnum(ExpenseCategory).default(ExpenseCategory.FOOD),
  splitType: z.nativeEnum(SplitType).default(SplitType.EQUAL),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  receiptUrl: z.string().url().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  participants: z.array(expenseParticipantSchema).min(1, 'At least 1 participant is required'),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createSettlementSchema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  notes: z.string().max(500).nullable().optional(),
});

export const updateSettlementSchema = z.object({
  status: z.nativeEnum(SettlementStatus),
  notes: z.string().max(500).nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;

// ==========================================
// Task Schemas
// ==========================================
export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title required').max(150),
  description: z.string().max(500).nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').nullable().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ==========================================
// Emergency Contact Schemas
// ==========================================
export const createEmergencyContactSchema = z.object({
  name: z.string().min(2).max(100),
  relationship: z.string().min(2).max(50),
  phone: z.string().min(5).max(20),
  altPhone: z.string().max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  isPrimary: z.boolean().default(false),
});

export const updateEmergencyContactSchema = createEmergencyContactSchema.partial();

export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
