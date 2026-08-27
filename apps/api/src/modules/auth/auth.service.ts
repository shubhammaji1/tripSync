import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, AuthResponse, InvitationStatus, TripRole } from '@tripsync/types';
import { AcceptInvitationInput, LoginInput, RegisterInput, VerifyEmailOtpInput } from '@tripsync/validation';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripInvitations, tripMembers, trips } from '../../database/schema';
import { and, eq } from 'drizzle-orm';
import { ProfileSyncService } from '../../common/profile-sync.service';

interface SupabaseAuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

interface SupabaseSessionResponse {
  access_token?: string;
  user?: SupabaseAuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly profileSync: ProfileSyncService,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
  ) {}

  private supabaseUrl(): string {
    const url = this.configService.get<string>('SUPABASE_URL');
    if (!url) {
      throw new ServiceUnavailableException('Supabase Auth is not configured on the server');
    }
    return url.replace(/\/$/, '');
  }

  private supabaseAnonKey(): string {
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');
    if (!key) {
      throw new ServiceUnavailableException('Supabase Auth is not configured on the server');
    }
    return key;
  }

  private async supabaseFetch(path: string, body: unknown): Promise<{ status: number; data: any }> {
    try {
      const res = await fetch(`${this.supabaseUrl()}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseAnonKey(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch {
      throw new ServiceUnavailableException('Authentication provider is unavailable. Please try again.');
    }
  }

  /**
   * New users must prove control of their email before TripSync creates a
   * session for them. Supabase exposes this setting through its public Auth
   * settings endpoint, so check it before creating an account rather than
   * discovering the misconfiguration after a session has already been issued.
   */
  private async ensureEmailOtpIsRequired(): Promise<void> {
    const res = await fetch(`${this.supabaseUrl()}/auth/v1/settings`, {
      headers: { apikey: this.supabaseAnonKey() },
    });
    const settings = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Unable to verify the email confirmation settings. Please try again shortly.',
      );
    }

    if (settings?.mailer_autoconfirm) {
      throw new ServiceUnavailableException(
        'Email OTP verification is not configured. In Supabase, enable Confirm email before registering.',
      );
    }
  }

  /**
   * Translates authentication-provider failures into useful application
   * errors. Supabase can surface an email quota error with either 400 or
   * 429, so match the provider's message as well as its HTTP status.
   */
  private throwAuthError(status: number, data: any, fallback: string): never {
    const message = data?.error_description || data?.msg || fallback;

    if (status === 429 || /rate limit|too many requests/i.test(message)) {
      throw new HttpException(
        'Too many verification emails have been requested. Please wait a few minutes before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new BadRequestException(message);
  }

  /**
   * Authenticates against Supabase Auth. TripSync's API never checks a
   * password itself - there is nothing here to bypass.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { status, data } = await this.supabaseFetch('/auth/v1/token?grant_type=password', {
      email: input.email,
      password: input.password,
    });

    if (status !== 200 || !data.access_token || !data.user) {
      throw new UnauthorizedException(
        data?.error_description || data?.msg || 'Incorrect email or password',
      );
    }

    const profile = await this.profileSync.syncFromClaims({
      sub: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      user_metadata: data.user.user_metadata,
    });

    return { user: profile, token: data.access_token };
  }

  /**
   * Creates a new Supabase Auth user. If the Supabase project requires
   * email confirmation, no session is issued yet - the caller must confirm
   * their email before they can log in.
   */
  async register(
    input: RegisterInput,
  ): Promise<AuthResponse | { requiresEmailConfirmation: true; message: string }> {
    await this.ensureEmailOtpIsRequired();

    const { status, data } = await this.supabaseFetch('/auth/v1/signup', {
      email: input.email,
      password: input.password,
      data: { full_name: input.fullName, phone: input.phone },
    });

    if (status >= 400) {
      if (status === 422 || /already registered/i.test(data?.msg || '')) {
        throw new ConflictException(
          'An account with this email address already exists. Please log in.',
        );
      }
      this.throwAuthError(status, data, 'Unable to register account');
    }

    if (!data.access_token || !data.user) {
      return {
        requiresEmailConfirmation: true,
        message: 'Account created. Check your email to confirm your account before logging in.',
      };
    }

    const profile = await this.profileSync.syncFromClaims({
      sub: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      user_metadata: data.user.user_metadata,
    });

    return { user: profile, token: data.access_token };
  }

  /**
   * Confirms the OTP issued by Supabase's Confirm signup email template.
   * A verified session is exchanged here rather than on the client so the
   * profile is synced before the user reaches the dashboard.
   */
  async verifyEmailOtp(input: VerifyEmailOtpInput): Promise<AuthResponse> {
    const { status, data } = await this.supabaseFetch('/auth/v1/verify', {
      email: input.email,
      token: input.token,
      type: 'email',
    });

    if (status !== 200 || !data.access_token || !data.user) {
      this.throwAuthError(
        status,
        data,
        'That verification code is invalid or has expired. Request a new code and try again.',
      );
    }

    const profile = await this.profileSync.syncFromClaims({
      sub: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      user_metadata: data.user.user_metadata,
    });

    return { user: profile, token: data.access_token };
  }

  /** Returns the caller's own profile row, already freshly synced by AuthGuard. */
  async getCurrentUserProfile(user: Profile): Promise<Profile> {
    return user;
  }

  /**
   * Public endpoint: creates a Supabase Auth account for a pending trip
   * invitation and joins the inviting trip. The invite's own email is used
   * (never a client-supplied one) so acceptance can't be redirected to a
   * different account than the one actually invited.
   */
  async acceptInvitation(input: AcceptInvitationInput, currentUser: Profile): Promise<{ accepted: true; user: Profile; tripId: string; role: string }> {
    const invite = await this.db.query.tripInvitations.findFirst({
      where: eq(tripInvitations.token, input.token),
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }
    if (new Date(invite.expiresAt) < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    const isShareable = invite.email === '*' || invite.token.startsWith('join_');
    if (!isShareable && invite.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new ForbiddenException(
        `This invitation was sent to ${invite.email}. Please sign in with ${invite.email} to join the trip.`,
      );
    }

    const trip = await this.db.query.trips.findFirst({
      where: eq(trips.id, invite.tripId),
    });
    const assignedRole = (trip && trip.ownerId === currentUser.id) ? TripRole.OWNER : invite.role;

    // Clerk owns the active session in the web app. Do not create a second
    // Supabase account from the invitation form; add the authenticated Clerk
    // user to the invited trip instead.
    await this.db.transaction(async (transaction) => {
      await (transaction
        .insert(tripMembers)
        .values({ tripId: invite.tripId, userId: currentUser.id, role: assignedRole } as any) as any)
        .onConflictDoUpdate({
          target: [tripMembers.tripId, tripMembers.userId],
          set: { role: assignedRole },
        });

      if (!isShareable) {
        await transaction.update(tripInvitations)
          .set({ status: InvitationStatus.ACCEPTED } as any)
          .where(and(eq(tripInvitations.token, input.token), eq(tripInvitations.status, InvitationStatus.PENDING)));
      }
    });
    return { accepted: true, user: currentUser, tripId: invite.tripId, role: assignedRole };
  }

  /**
   * Public endpoint: retrieve invitation details for UI preview.
   */
  async getInvitationByToken(token: string) {
    const invite = await this.db.query.tripInvitations.findFirst({
      where: eq(tripInvitations.token, token),
      with: {
        trip: true,
        inviter: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    const isExpired = new Date(invite.expiresAt) < new Date();
    const isShareable = invite.email === '*' || invite.token.startsWith('join_');

    return {
      id: invite.id,
      tripId: invite.tripId,
      tripName: invite.trip?.name || 'Group Trip',
      tripDestination: invite.trip?.destination || '',
      email: isShareable ? null : invite.email,
      isShareable,
      role: invite.role,
      status: isExpired ? InvitationStatus.EXPIRED : invite.status,
      expiresAt: invite.expiresAt,
      inviterName: invite.inviter?.fullName || invite.inviter?.email || 'Trip organizer',
    };
  }
}
