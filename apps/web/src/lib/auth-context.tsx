'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, TripRole } from '@tripsync/types';
import { api } from './api';

export type Permission =
  | 'DELETE_TRIP'
  | 'MANAGE_ROLES'
  | 'EDIT_TRIP'
  | 'INVITE_MEMBERS'
  | 'ADD_EXPENSE'
  | 'ADD_ACTIVITY'
  | 'MANAGE_TASKS';

/**
 * Pure permission check. Deliberately takes `role` as an argument instead of
 * reading it from ambient/global state - the caller is responsible for
 * supplying the real role for the trip in question (e.g. from that trip's
 * member list), so there is no single "current role" a user can switch
 * client-side. The backend re-checks every mutation regardless; this is a
 * UI convenience only.
 */
export function canForRole(role: TripRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  switch (permission) {
    case 'DELETE_TRIP':
      return role === TripRole.OWNER;
    case 'MANAGE_ROLES':
    case 'EDIT_TRIP':
    case 'INVITE_MEMBERS':
      return role === TripRole.OWNER || role === TripRole.ADMIN;
    case 'ADD_ACTIVITY':
    case 'ADD_EXPENSE':
    case 'MANAGE_TASKS':
      return role === TripRole.OWNER || role === TripRole.ADMIN || role === TripRole.MEMBER;
    default:
      return false;
  }
}

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  /** true while an existing session token is being validated against the backend on load */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<{ requiresEmailConfirmation: true; message: string } | void>;
  logout: () => void;
  /** Used by flows (e.g. accept-invitation) that receive a session outside of login()/register() */
  setSession: (user: Profile, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const setSession = (nextUser: Profile, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setSession(res.user, res.token);
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const res = await api.register({ fullName, email, password, phone });
    if ('requiresEmailConfirmation' in res) {
      return res;
    }
    setSession(res.user, res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    api.logout().catch(() => {
      /* best-effort - client state is already cleared */
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        setSession,
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
