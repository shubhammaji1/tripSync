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
} from './enums';

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  currency: string;
  coverImage: string | null;
  privacy: TripPrivacy;
  status: TripStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  totalExpenses?: number;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: TripRole;
  joinedAt: string;
  profile?: Profile;
}

export interface TripInvitation {
  id: string;
  tripId: string;
  invitedBy: string;
  email: string;
  token: string;
  role: TripRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
  title: string | null;
  notes: string | null;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  dayId: string;
  tripId: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  estimatedCost: number | null;
  currency: string;
  responsibleMemberId: string | null;
  responsibleMember?: Profile | null;
  status: ActivityStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
  percentage?: number | null;
  shares?: number | null;
  user?: Profile;
}

export interface Expense {
  id: string;
  tripId: string;
  paidById: string;
  paidBy?: Profile;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  splitType: SplitType;
  date: string;
  receiptUrl: string | null;
  notes: string | null;
  participants?: ExpenseParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  tripId: string;
  fromUserId: string;
  fromUser?: Profile;
  toUserId: string;
  toUser?: Profile;
  amount: number;
  currency: string;
  status: SettlementStatus;
  settledAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  assignedToId: string | null;
  assignedTo?: Profile | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  tripId: string;
  name: string;
  relationship: string;
  phone: string;
  altPhone: string | null;
  notes: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface TripDocument {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  tripId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BalanceSummary {
  userId: string;
  user: Profile;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive, negative = owes
}

export interface OptimizedTransfer {
  fromUserId: string;
  fromUser: Profile;
  toUserId: string;
  toUser: Profile;
  amount: number;
  currency: string;
}

export interface TripAnalytics {
  totalSpent: number;
  budget: number | null;
  remainingBudget: number | null;
  currency: string;
  categoryBreakdown: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  memberSpending: {
    userId: string;
    userName: string;
    paidAmount: number;
    shareAmount: number;
    netBalance: number;
  }[];
  dailySpending: {
    date: string;
    amount: number;
  }[];
}

export interface AuthResponse {
  user: Profile;
  token: string;
  expiresIn?: number;
}

export interface DemoPersona {
  id: string;
  email: string;
  fullName: string;
  role: TripRole;
  avatarUrl: string | null;
  phone: string | null;
  description: string;
}

