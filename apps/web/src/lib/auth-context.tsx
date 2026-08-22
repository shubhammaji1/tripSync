'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, TripRole, DemoPersona } from '@tripsync/types';
import { api } from './api';

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'rahul@tripsync.io',
    fullName: 'Rahul Sharma',
    role: TripRole.OWNER,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43210',
    description: 'Trip Creator & Lead Organizer with full administrative rights over budget, settings, and member roles.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'shubham@tripsync.io',
    fullName: 'Shubham Verma',
    role: TripRole.ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43211',
    description: 'Co-Organizer managing itineraries, activity times, group logistics, and member invites.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'priya@tripsync.io',
    fullName: 'Priya Patel',
    role: TripRole.MEMBER,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43212',
    description: 'Active Group Traveler adding expenses, splitting bills, suggesting itinerary items, and completing tasks.',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'ananya.guest@tripsync.io',
    fullName: 'Ananya Sen',
    role: TripRole.VIEWER,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43299',
    description: 'Family / Guest Viewer with read-only schedule, budget tracking, and emergency contact visibility.',
  },
];

export type Permission =
  | 'DELETE_TRIP'
  | 'MANAGE_ROLES'
  | 'EDIT_TRIP'
  | 'INVITE_MEMBERS'
  | 'ADD_EXPENSE'
  | 'ADD_ACTIVITY'
  | 'MANAGE_TASKS';

interface AuthContextType {
  user: Profile | null;
  activePersona: DemoPersona | null;
  currentRole: TripRole;
  token: string | null;
  isAuthenticated: boolean;
  personas: DemoPersona[];
  login: (email: string, password?: string) => Promise<void>;
  register: (fullName: string, email: string, password?: string, phone?: string) => Promise<void>;
  logout: () => void;
  switchPersona: (personaId: string) => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [activePersona, setActivePersona] = useState<DemoPersona | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearAuthStorage = () => {
    localStorage.removeItem('tripsync_user');
    localStorage.removeItem('tripsync_token');
    localStorage.removeItem('tripsync_persona_id');
    sessionStorage.removeItem('tripsync_user');
    sessionStorage.removeItem('tripsync_token');
    sessionStorage.removeItem('tripsync_persona_id');
  };

  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('tripsync_user');
      const savedToken = localStorage.getItem('tripsync_token');
      const savedPersonaId = localStorage.getItem('tripsync_persona_id');

      if (savedPersonaId) {
        const foundPersona = DEMO_PERSONAS.find((p) => p.id === savedPersonaId);
        if (foundPersona) {
          setActivePersona(foundPersona);
          setUser({
            id: foundPersona.id,
            email: foundPersona.email,
            fullName: foundPersona.fullName,
            avatarUrl: foundPersona.avatarUrl,
            phone: foundPersona.phone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setToken(`demo_token_${foundPersona.id}`);
          return;
        }
      }

      if (savedUserStr && savedToken) {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setToken(savedToken);
        const match = DEMO_PERSONAS.find((p) => p.id === parsed.id || p.email.toLowerCase() === parsed.email?.toLowerCase());
        setActivePersona(match || null);
      }
    } catch (e) {
      console.warn('Auth local storage restore warning:', e);
    }
  }, []);

  const currentRole: TripRole = activePersona?.role ?? TripRole.OWNER;

  const login = async (email: string, password: string = 'password123') => {
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('tripsync_user', JSON.stringify(res.user));
      localStorage.setItem('tripsync_token', res.token);

      const match = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase() || p.id === res.user.id);
      setActivePersona(null);
      localStorage.removeItem('tripsync_persona_id');
      if (match && email.toLowerCase() === match.email.toLowerCase() && res.user.email?.toLowerCase() === match.email.toLowerCase()) {
        setActivePersona(match);
        localStorage.setItem('tripsync_persona_id', match.id);
      }
    } catch (err) {
      // Fallback local login if backend is unreachable
      const emailLower = email.toLowerCase().trim();
      const persona = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === emailLower);
      if (persona) {
        const fallbackProfile: Profile = {
          id: persona.id,
          email: persona.email,
          fullName: persona.fullName,
          avatarUrl: persona.avatarUrl,
          phone: persona.phone,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(fallbackProfile);
        setActivePersona(persona);
        setToken(`demo_token_${persona.id}`);
        localStorage.setItem('tripsync_user', JSON.stringify(fallbackProfile));
        localStorage.setItem('tripsync_token', `demo_token_${persona.id}`);
        localStorage.setItem('tripsync_persona_id', persona.id);
        return;
      }

      const namePart = email.split('@')[0];
      const newCustomUser: Profile = {
        id: 'user-' + Date.now(),
        email,
        fullName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
        phone: '+91 98765 00000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(newCustomUser);
      setActivePersona(null);
      setToken(`user_token_${newCustomUser.id}`);
      localStorage.setItem('tripsync_user', JSON.stringify(newCustomUser));
      localStorage.setItem('tripsync_token', `user_token_${newCustomUser.id}`);
      localStorage.removeItem('tripsync_persona_id');
    }
  };

  const register = async (fullName: string, email: string, password: string = 'password123', phone?: string) => {
    try {
      const res = await api.register({ fullName, email, password, phone });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('tripsync_user', JSON.stringify(res.user));
      localStorage.setItem('tripsync_token', res.token);
      setActivePersona(null);
      localStorage.removeItem('tripsync_persona_id');
    } catch (err) {
      const newCustomUser: Profile = {
        id: 'user-' + Date.now(),
        email,
        fullName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        phone: phone || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(newCustomUser);
      setActivePersona(null);
      setToken(`user_token_${newCustomUser.id}`);
      localStorage.setItem('tripsync_user', JSON.stringify(newCustomUser));
      localStorage.setItem('tripsync_token', `user_token_${newCustomUser.id}`);
      localStorage.removeItem('tripsync_persona_id');
    }
  };

  const logout = () => {
    setUser(null);
    setActivePersona(null);
    setToken(null);
    clearAuthStorage();
  };

  const switchPersona = (personaId: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!persona) return;

    const newProfile: Profile = {
      id: persona.id,
      email: persona.email,
      fullName: persona.fullName,
      avatarUrl: persona.avatarUrl,
      phone: persona.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(newProfile);
    setActivePersona(persona);
    setToken(`demo_token_${persona.id}`);
    localStorage.setItem('tripsync_user', JSON.stringify(newProfile));
    localStorage.setItem('tripsync_token', `demo_token_${persona.id}`);
    localStorage.setItem('tripsync_persona_id', persona.id);
  };

  /**
   * Evaluates if the current user has permission to execute an action
   * OWNER > ADMIN > MEMBER > VIEWER
   */
  const can = (permission: Permission): boolean => {
    const role = currentRole;

    switch (permission) {
      case 'DELETE_TRIP':
        return role === TripRole.OWNER;
      case 'MANAGE_ROLES':
        return role === TripRole.OWNER || role === TripRole.ADMIN;
      case 'EDIT_TRIP':
        return role === TripRole.OWNER || role === TripRole.ADMIN;
      case 'INVITE_MEMBERS':
        return role === TripRole.OWNER || role === TripRole.ADMIN;
      case 'ADD_ACTIVITY':
        return role === TripRole.OWNER || role === TripRole.ADMIN || role === TripRole.MEMBER;
      case 'ADD_EXPENSE':
        return role === TripRole.OWNER || role === TripRole.ADMIN || role === TripRole.MEMBER;
      case 'MANAGE_TASKS':
        return role === TripRole.OWNER || role === TripRole.ADMIN || role === TripRole.MEMBER;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activePersona,
        currentRole,
        token,
        isAuthenticated: !!user,
        personas: DEMO_PERSONAS,
        login,
        register,
        logout,
        switchPersona,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
