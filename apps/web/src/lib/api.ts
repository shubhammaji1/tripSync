import { Profile, AuthResponse } from '@tripsync/types';
import { LoginInput, RegisterInput } from '@tripsync/validation';

type InvitationAcceptanceResponse =
  | AuthResponse
  | { accepted: true; user: Profile; tripId: string; role: string }
  | { requiresEmailConfirmation: true; message: string };

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').endsWith('/api/v1')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setApiAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  authTokenProvider = provider;
}

function getAuthToken(): string | null {
  return null;
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authTokenProvider ? await authTokenProvider() : getAuthToken();

  const headers: Record<string, string> = {
    ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      let errorData: any = {};
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch {
        errorData = { message: errorText };
      }
      const fieldError = Array.isArray(errorData.errors) ? errorData.errors[0]?.message : undefined;
      const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
      throw new Error(fieldError || message || `API error: ${res.status}`);
    }

    const text = await res.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const helpfulError = new Error(
        `Unable to reach TripSync API at ${API_BASE_URL}. Please ensure the backend server is running.`
      );
      console.warn(`API request to ${endpoint} failed:`, helpfulError.message);
      throw helpfulError;
    }
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth & Profiles
  login: (data: LoginInput) => fetcher<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: RegisterInput) =>
    fetcher<AuthResponse | { requiresEmailConfirmation: true; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verifyEmailOtp: (data: { email: string; token: string }) =>
    fetcher<AuthResponse>('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => fetcher<Profile>('/auth/me'),
  logout: () => fetcher<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  getInvitation: (token: string) => fetcher<any>(`/auth/invitations/${token}`),
  acceptInvitation: (data: { token: string; fullName: string; password?: string }) =>
    fetcher<InvitationAcceptanceResponse>('/auth/accept-invitation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Trips
  getTrips: () => fetcher<any[]>('/trips'),
  getTripById: (tripId: string) => fetcher<any>(`/trips/${tripId}`),
  createTrip: (data: any) => fetcher<any>('/trips', { method: 'POST', body: JSON.stringify(data) }),
  updateTrip: (tripId: string, data: any) => fetcher<any>(`/trips/${tripId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTrip: (tripId: string) => fetcher<any>(`/trips/${tripId}`, { method: 'DELETE' }),

  // Itinerary
  getItinerary: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/itinerary`),
  createTripDay: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/itinerary/days`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTripDay: (tripId: string, dayId: string) =>
    fetcher<any>(`/trips/${tripId}/itinerary/days/${dayId}`, { method: 'DELETE' }),
  createActivity: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/itinerary/activities`, { method: 'POST', body: JSON.stringify(data) }),
  deleteActivity: (activityId: string) =>
    fetcher<any>(`/trips/itinerary/activities/${activityId}`, { method: 'DELETE' }),

  // Expenses & Settlements
  getExpenses: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/expenses`),
  createExpense: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (tripId: string, expenseId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/expenses/${expenseId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExpense: (tripId: string, expenseId: string) =>
    fetcher<any>(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' }),
  getSettlements: (tripId: string) => fetcher<any>(`/trips/${tripId}/settlements`),
  recordSettlement: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/settlements`, { method: 'POST', body: JSON.stringify(data) }),

  // Tasks
  getTasks: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/tasks`),
  createTask: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (tripId: string, taskId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Emergency
  getEmergencyContacts: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/emergency/contacts`),
  getEmergencyPacket: (tripId: string) => fetcher<any>(`/trips/${tripId}/emergency/packet`),
  createEmergencyContact: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/emergency/contacts`, { method: 'POST', body: JSON.stringify(data) }),
  updateEmergencyContact: (tripId: string, contactId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/emergency/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEmergencyContact: (tripId: string, contactId: string) =>
    fetcher<any>(`/trips/${tripId}/emergency/contacts/${contactId}`, { method: 'DELETE' }),
  seedStarterEmergencyContacts: (tripId: string) =>
    fetcher<any[]>(`/trips/${tripId}/emergency/seed-starter`, { method: 'POST', body: JSON.stringify({}) }),

  // Analytics
  getAnalytics: (tripId: string) => fetcher<any>(`/trips/${tripId}/analytics`),

  // Members & RBAC
  getMembers: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/members`),
  getShareLink: (tripId: string) => fetcher<any>(`/trips/${tripId}/members/share-link`),
  createShareLink: (tripId: string, data?: { role?: string }) =>
    fetcher<any>(`/trips/${tripId}/members/share-link`, { method: 'POST', body: JSON.stringify(data || {}) }),
  bulkInviteMembers: (tripId: string, data: { emails: string[]; role?: string }) =>
    fetcher<any>(`/trips/${tripId}/members/bulk-invite`, { method: 'POST', body: JSON.stringify(data) }),
  inviteMember: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/members/invite`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (tripId: string, userId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateMemberPhone: (tripId: string, userId: string, phone: string | null) =>
    fetcher<any>(`/trips/${tripId}/members/${userId}/phone`, { method: 'PATCH', body: JSON.stringify({ phone }) }),
  removeMember: (tripId: string, userId: string) =>
    fetcher<any>(`/trips/${tripId}/members/${userId}`, { method: 'DELETE' }),
};
