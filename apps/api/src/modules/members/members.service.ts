import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InviteMemberInput, UpdateMemberRoleInput } from '@tripsync/validation';
import { TripRole, InvitationStatus } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripMembers, tripInvitations, profiles, trips } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { MailService } from '../../common/mail.service';

@Injectable()
export class MembersService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: DrizzleDB,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private async requireManager(tripId: string, userId: string): Promise<void> {
    const membership = await this.db.query.tripMembers.findFirst({
      where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
    });
    if (!membership || ![TripRole.OWNER, TripRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Only trip owners and admins can manage members');
    }
  }

  async getTripMembers(tripId: string) {
    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, tripId),
      with: { owner: true },
    });
    const members = await this.db.query.tripMembers.findMany({
      where: eq(tripMembers.tripId, tripId),
      with: { user: true },
    });
    if (!trip) return members;

    const mapped = members.map((m: any) => {
      if (m.userId === trip.ownerId) {
        return { ...m, role: TripRole.OWNER };
      }
      return m;
    });

    const hasOwner = mapped.some((m: any) => m.userId === trip.ownerId);
    if (!hasOwner && trip.owner) {
      mapped.unshift({
        tripId: trip.id,
        userId: trip.ownerId,
        role: TripRole.OWNER,
        joinedAt: trip.createdAt,
        user: trip.owner,
      } as any);
    }
    return mapped;
  }

  async inviteMember(tripId: string, invitedBy: string, input: InviteMemberInput) {
    await this.requireManager(tripId, invitedBy);
    const token = `inv_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invite] = await (this.db.insert(tripInvitations).values({
      tripId,
      invitedBy,
      email: input.email.trim().toLowerCase(),
      token,
      role: input.role,
      status: InvitationStatus.PENDING,
      expiresAt,
    } as any) as any).returning();

    const baseUrl = (this.configService.get<string>('WEB_URL') || 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    const inviteLink = `${baseUrl}/invite/${token}`;

    // Query trip & inviter for rich email
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    const inviter = await this.db.query.profiles.findFirst({ where: eq(profiles.id, invitedBy) });

    const mailResult = await this.mailService.sendTripInvitation({
      to: input.email.trim().toLowerCase(),
      tripName: trip?.name || 'Group Trip',
      tripDestination: trip?.destination || '',
      inviterName: inviter?.fullName || inviter?.email || 'Trip Organizer',
      role: input.role,
      inviteLink,
    });

    return { ...invite, inviteLink, emailSent: mailResult.sent };
  }

  async getOrCreateShareLink(tripId: string, invitedBy: string, role: TripRole = TripRole.MEMBER) {
    await this.requireManager(tripId, invitedBy);

    // Look for existing active shareable link
    const existing = await this.db.query.tripInvitations.findFirst({
      where: and(
        eq(tripInvitations.tripId, tripId),
        eq(tripInvitations.email, '*'),
        eq(tripInvitations.status, InvitationStatus.PENDING),
      ),
    });

    const baseUrl = (this.configService.get<string>('WEB_URL') || 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    if (existing && new Date(existing.expiresAt) > new Date()) {
      return {
        ...existing,
        inviteLink: `${baseUrl}/invite/${existing.token}`,
      };
    }

    const token = `join_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [invite] = await (this.db.insert(tripInvitations).values({
      tripId,
      invitedBy,
      email: '*',
      token,
      role: role || TripRole.MEMBER,
      status: InvitationStatus.PENDING,
      expiresAt,
    } as any) as any).returning();

    return {
      ...invite,
      inviteLink: `${baseUrl}/invite/${token}`,
    };
  }

  async bulkInviteMembers(tripId: string, invitedBy: string, emails: string[], role: TripRole = TripRole.MEMBER) {
    await this.requireManager(tripId, invitedBy);

    const cleanEmails = Array.from(
      new Set((emails || []).map((e) => e.trim().toLowerCase()).filter(Boolean)),
    );

    if (cleanEmails.length === 0) {
      return { count: 0, invitations: [] };
    }

    const baseUrl = (this.configService.get<string>('WEB_URL') || 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const createdInvites = [];

    // Query trip and inviter once for all bulk invites
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    const inviter = await this.db.query.profiles.findFirst({ where: eq(profiles.id, invitedBy) });

    let emailsDelivered = 0;

    for (const email of cleanEmails) {
      const token = `inv_${randomUUID().replace(/-/g, '')}`;
      const [invite] = await (this.db.insert(tripInvitations).values({
        tripId,
        invitedBy,
        email,
        token,
        role: role || TripRole.MEMBER,
        status: InvitationStatus.PENDING,
        expiresAt,
      } as any) as any).returning();

      const inviteLink = `${baseUrl}/invite/${token}`;

      const mailResult = await this.mailService.sendTripInvitation({
        to: email,
        tripName: trip?.name || 'Group Trip',
        tripDestination: trip?.destination || '',
        inviterName: inviter?.fullName || inviter?.email || 'Trip Organizer',
        role: role || TripRole.MEMBER,
        inviteLink,
      });

      if (mailResult.sent) {
        emailsDelivered++;
      }

      createdInvites.push({
        ...invite,
        inviteLink,
        emailSent: mailResult.sent,
      });
    }

    return {
      count: createdInvites.length,
      emailsDelivered,
      invitations: createdInvites,
    };
  }

  async updateMemberRole(tripId: string, actingUserId: string, memberUserId: string, input: UpdateMemberRoleInput) {
    await this.requireManager(tripId, actingUserId);
    const [updated] = await (this.db.update(tripMembers)
          .set({ role: input.role } as any) as any)
          .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, memberUserId)))
          .returning();
    return updated;
  }

  async updateMemberPhone(tripId: string, actingUserId: string, memberUserId: string, phone: string | null) {
    if (actingUserId !== memberUserId) {
      await this.requireManager(tripId, actingUserId);
    }
    const cleanPhone = phone ? phone.trim() : null;
    const [updated] = await (this.db
      .update(profiles)
      .set({ phone: cleanPhone, updatedAt: new Date() } as any)
      .where(eq(profiles.id, memberUserId)) as any).returning();
    return updated || { id: memberUserId, phone: cleanPhone };
  }

  async removeMember(tripId: string, actingUserId: string, memberUserId: string) {
    await this.requireManager(tripId, actingUserId);
    await this.db.delete(tripMembers)
          .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, memberUserId)));
    return { success: true };
  }
}
