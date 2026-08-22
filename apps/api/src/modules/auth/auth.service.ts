import { Injectable, Inject, Optional, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { Profile, TripRole, AuthResponse, DemoPersona } from '@tripsync/types';
import { AcceptInvitationInput, LoginInput, RegisterInput } from '@tripsync/validation';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { profiles, tripInvitations, tripMembers } from '../../database/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'rahul@tripsync.io',
    fullName: 'Rahul Sharma',
    role: TripRole.OWNER,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43210',
    description: 'Trip Creator & Lead Organizer with full administrative control over budget, settings, and member roles.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'shubham@tripsync.io',
    fullName: 'Shubham Verma',
    role: TripRole.ADMIN,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43211',
    description: 'Co-Organizer managing daily itineraries, activity schedules, and group logistics.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'priya@tripsync.io',
    fullName: 'Priya Patel',
    role: TripRole.MEMBER,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43212',
    description: 'Active Traveler logging restaurant & sightseeing expenses, suggesting activities, and checking off tasks.',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'ananya.guest@tripsync.io',
    fullName: 'Ananya Sen',
    role: TripRole.VIEWER,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    phone: '+91 98765 43299',
    description: 'Guest / Family Viewer with read-only schedule and emergency access (cannot mutate or add expenses).',
  },
];

@Injectable()
export class AuthService {
  private registeredUsers: Map<string, Profile> = new Map();
  private passwords: Map<string, string> = new Map();
  private invitations: Map<string, { email: string; role: TripRole; tripId: string; invitedBy: string; expiresAt: Date }> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    for (const p of DEMO_PERSONAS) {
      this.registeredUsers.set(p.email.toLowerCase(), {
        id: p.id,
        email: p.email,
        fullName: p.fullName,
        avatarUrl: p.avatarUrl,
        phone: p.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  private mapDbToProfile(dbProfile: any): Profile {
    return {
      id: dbProfile.id,
      email: dbProfile.email,
      fullName: dbProfile.fullName || null,
      avatarUrl: dbProfile.avatarUrl || null,
      phone: dbProfile.phone || null,
      createdAt: dbProfile.createdAt instanceof Date ? dbProfile.createdAt.toISOString() : String(dbProfile.createdAt || ''),
      updatedAt: dbProfile.updatedAt instanceof Date ? dbProfile.updatedAt.toISOString() : String(dbProfile.updatedAt || ''),
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const emailLower = input.email.toLowerCase().trim();

    const persona = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === emailLower);
    if (persona) {
      const userProfile: Profile = {
        id: persona.id,
        email: persona.email,
        fullName: persona.fullName,
        avatarUrl: persona.avatarUrl,
        phone: persona.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        user: userProfile,
        token: `demo_token_${persona.id}`,
      };
    }

    if (this.registeredUsers.has(emailLower)) {
      const password = this.passwords.get(emailLower);
      if (password && password !== input.password) {
        throw new BadRequestException('Incorrect email or password');
      }
      const user = this.registeredUsers.get(emailLower)!;
      return {
        user,
        token: `user_token_${user.id}`,
      };
    }

    if (this.db) {
      try {
        const found = await this.db.query.profiles.findFirst({
          where: eq(profiles.email, emailLower),
        });
        if (found) {
          return {
            user: this.mapDbToProfile(found),
            token: `db_token_${found.id}`,
          };
        }
      } catch (err) {
        console.warn('Database user search error:', err);
      }
    }

    const newUserId = randomUUID();
    const namePart = input.email.split('@')[0];
    const newUser: Profile = {
      id: newUserId,
      email: input.email,
      fullName: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${namePart}`,
      phone: '+91 98000 00000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.registeredUsers.set(emailLower, newUser);

    return {
      user: newUser,
      token: `user_token_${newUser.id}`,
    };
  }

  createInvitation(input: { tripId: string; invitedBy: string; email: string; role: TripRole }) {
    const token = `inv_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.invitations.set(token, { ...input, email: input.email.toLowerCase(), expiresAt });
    return { token, expiresAt };
  }

  async getInvitation(token: string) {
    const localInvite = this.invitations.get(token);
    if (localInvite) {
      if (localInvite.expiresAt < new Date()) throw new BadRequestException('This invitation has expired');
      return { ...localInvite, token };
    }

    if (this.db) {
      const invite = await this.db.query.tripInvitations.findFirst({ where: eq(tripInvitations.token, token) });
      if (invite) {
        if (invite.expiresAt < new Date()) throw new BadRequestException('This invitation has expired');
        return invite;
      }
    }
    throw new NotFoundException('Invitation not found');
  }

  async acceptInvitation(input: AcceptInvitationInput): Promise<AuthResponse> {
    const invite = await this.getInvitation(input.token);
    const email = invite.email.toLowerCase();
    if (this.registeredUsers.has(email)) throw new ConflictException('An account with this email already exists. Please log in.');

    const userId = randomUUID();
    const user: Profile = {
      id: userId,
      email,
      fullName: input.fullName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.fullName)}`,
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      await (this.db.insert(profiles).values({ id: userId, email, fullName: input.fullName, avatarUrl: user.avatarUrl } as any) as any);
      await (this.db.insert(tripMembers).values({ tripId: invite.tripId, userId, role: invite.role } as any) as any);
      await (this.db.update(tripInvitations).set({ status: 'ACCEPTED' } as any).where(eq(tripInvitations.token, input.token)) as any);
    }

    this.registeredUsers.set(email, user);
    this.passwords.set(email, input.password);
    this.invitations.delete(input.token);
    return { user, token: `user_token_${user.id}` };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const emailLower = input.email.toLowerCase().trim();

    if (this.registeredUsers.has(emailLower)) {
      throw new ConflictException('An account with this email address already exists. Please log in.');
    }

    const newUserId = randomUUID();
    const newUser: Profile = {
      id: newUserId,
      email: input.email,
      fullName: input.fullName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.fullName)}`,
      phone: input.phone || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.db) {
      try {
        await this.db.insert(profiles).values({
          id: newUserId,
          email: input.email,
          fullName: input.fullName,
          avatarUrl: newUser.avatarUrl,
          phone: input.phone || null,
        } as any);
      } catch (err) {
        console.warn('Database profile insertion fallback:', err);
      }
    }

    this.registeredUsers.set(emailLower, newUser);

    return {
      user: newUser,
      token: `user_token_${newUser.id}`,
    };
  }

  async getCurrentUserProfile(user: Profile): Promise<Profile> {
    if (this.db) {
      try {
        const profile = await this.db.query.profiles.findFirst({
          where: eq(profiles.id, user.id),
        });
        if (profile) return this.mapDbToProfile(profile);
      } catch (err) {
        console.warn('Profile fetch db error, using session user:', err);
      }
    }
    return user;
  }

  async getDemoPersonas(): Promise<DemoPersona[]> {
    return DEMO_PERSONAS;
  }
}
