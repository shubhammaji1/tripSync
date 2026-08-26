import { Profile, AuthResponse } from '@tripsync/types';
import { LoginInput, RegisterInput } from '@tripsync/validation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let authTokenProvider: (() => Promise<string | null>) | null = null;

export function setApiAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  authTokenProvider = provider;
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tripsync_token');
  }
  return null;
}

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authTokenProvider ? await authTokenProvider() : getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
      const errorData = await res.json().catch(() => ({}));
      const fieldError = Array.isArray(errorData.errors) ? errorData.errors[0]?.message : undefined;
      const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
      throw new Error(fieldError || message || `API error: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
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
  acceptInvitation: (data: { token: string; fullName: string; password: string }) =>
    fetcher<AuthResponse | { requiresEmailConfirmation: true; message: string }>('/auth/accept-invitation', {
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

  // Analytics
  getAnalytics: (tripId: string) => fetcher<any>(`/trips/${tripId}/analytics`),

  // Members & RBAC
  getMembers: (tripId: string) => fetcher<any[]>(`/trips/${tripId}/members`),
  inviteMember: (tripId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/members/invite`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberRole: (tripId: string, userId: string, data: any) =>
    fetcher<any>(`/trips/${tripId}/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeMember: (tripId: string, userId: string) =>
    fetcher<any>(`/trips/${tripId}/members/${userId}`, { method: 'DELETE' }),
};
