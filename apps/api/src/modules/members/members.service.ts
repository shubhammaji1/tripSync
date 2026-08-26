import { Injectable, Inject, Optional } from '@nestjs/common';
import { InviteMemberInput, UpdateMemberRoleInput } from '@tripsync/validation';
import { TripRole, InvitationStatus } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripMembers, tripInvitations, profiles } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { SEED_USERS } from '../../database/seed';
import { randomUUID } from 'crypto';

export const mockInvitations = new Map<string, any>();

@Injectable()
export class MembersService {
  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB,
  ) {}

  async getTripMembers(tripId: string) {
    if (this.db) {
      try {
        const members = await this.db.query.tripMembers.findMany({
          where: eq(tripMembers.tripId, tripId),
          with: { user: true },
        });
        return members;
      } catch (err) {
        console.warn('Members query fallback to seed users:', err);
      }
    }

    return SEED_USERS.map((u, idx) => ({
      id: `member-${idx + 1}`,
      tripId,
      userId: u.id,
      role: idx === 0 ? TripRole.OWNER : idx === 1 ? TripRole.ADMIN : TripRole.MEMBER,
      joinedAt: '2026-08-01T00:00:00Z',
      user: u,
    }));
  }

  async inviteMember(tripId: string, invitedBy: string, input: InviteMemberInput) {
    const token = `inv_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (this.db) {
      try {
        const [invite] = await (this.db.insert(tripInvitations).values({
          tripId,
          invitedBy,
          email: input.email,
          token,
          role: input.role,
          status: InvitationStatus.PENDING,
          expiresAt,
        } as any) as any).returning();
        return { ...invite, inviteLink: `http://localhost:3000/invite/${token}` };
      } catch (err) {
        console.warn('Invite insertion db error:', err);
      }
    }

    const fallbackInvitation = {
      id: 'invite-' + Date.now(),
      tripId,
      invitedBy,
      email: input.email,
      token,
      role: input.role,
      status: InvitationStatus.PENDING,
      expiresAt: expiresAt.toISOString(),
      inviteLink: `http://localhost:3000/invite/${token}`,
    };
    mockInvitations.set(token, fallbackInvitation);
    return fallbackInvitation;
  }

  async updateMemberRole(tripId: string, memberUserId: string, input: UpdateMemberRoleInput) {
    if (this.db) {
      try {
        const [updated] = await (this.db.update(tripMembers)
          .set({ role: input.role } as any) as any)
          .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, memberUserId)))
          .returning();
        return updated;
      } catch (err) {
        console.warn('Member update db error:', err);
      }
    }

    return {
      tripId,
      userId: memberUserId,
      role: input.role,
    };
  }

  async removeMember(tripId: string, memberUserId: string) {
    if (this.db) {
      try {
        await this.db.delete(tripMembers)
          .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, memberUserId)));
        return { success: true };
      } catch (err) {
        console.warn('Member delete db error:', err);
      }
    }

    return { success: true };
  }
}
