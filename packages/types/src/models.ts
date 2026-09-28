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
  TrailWatchSeverity,
  TrailWatchAlertType,
  TrailReportCategory,
  VerificationStatus,
  RouteStatus,
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

// ==========================================
// TrailWatch Models
// ==========================================
export interface TripRoute {
  id: string;
  tripId: string;
  name: string;
  description?: string | null;
  startLocation: string;
  endLocation: string;
  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;
  status: RouteStatus;
  distanceKm?: number | null;
  estimatedDurationMin?: number | null;
  lastCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  segments?: RouteSegment[];
  activeAlertsCount?: number;
}

export interface RouteSegment {
  id: string;
  routeId: string;
  name: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  status: RouteStatus;
  surfaceType?: string | null;
  elevationGainM?: number | null;
  conditionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrailReport {
  id: string;
  tripId: string;
  routeId?: string | null;
  segmentId?: string | null;
  userId: string;
  user?: Profile | null;
  category: TrailReportCategory;
  severity: TrailWatchSeverity;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  imageUrl?: string | null;
  verificationStatus: VerificationStatus;
  upvotes: number;
  source: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherSnapshot {
  id: string;
  tripId: string;
  routeId?: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike?: number | null;
  rainfallMm: number;
  visibilityKm?: number | null;
  windSpeedKmh: number;
  humidityPercent: number;
  condition: string;
  weatherCode?: number | null;
  source: string;
  recordedAt: string;
}

export interface TrailWatchAlert {
  id: string;
  tripId: string;
  routeId?: string | null;
  activityId?: string | null;
  reportId?: string | null;
  type: TrailWatchAlertType;
  severity: TrailWatchSeverity;
  title: string;
  description: string;
  source: string;
  confidence: number; // 0 to 1
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  acknowledgedById?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AffectedActivity {
  activityId: string;
  activityTitle: string;
  dayNumber: number;
  dayDate: string;
  startTime?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reason: string;
  severity: TrailWatchSeverity;
  alertId?: string | null;
  conditionDescription: string;
  lastUpdated: string;
  source: string;
}

export interface TrailWatchOverview {
  tripId: string;
  destination: string;
  overallStatus: RouteStatus;
  monitoredRoutesCount: number;
  activeAlertsCount: number;
  affectedActivitiesCount: number;
  communityReportsCount: number;
  routes: TripRoute[];
  alerts: TrailWatchAlert[];
  reports: TrailReport[];
  affectedActivities: AffectedActivity[];
  latestWeather?: WeatherSnapshot | null;
  lastRefreshedAt: string;
}

