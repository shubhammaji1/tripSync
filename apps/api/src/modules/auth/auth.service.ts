import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, AuthResponse, InvitationStatus } from '@tripsync/types';
import { AcceptInvitationInput, LoginInput, RegisterInput } from '@tripsync/validation';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tripInvitations, tripMembers } from '../../database/schema';
import { eq } from 'drizzle-orm';
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
      throw new BadRequestException(data?.error_description || data?.msg || 'Unable to register account');
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
  async acceptInvitation(input: AcceptInvitationInput): Promise<AuthResponse | { requiresEmailConfirmation: true; message: string }> {
    const invite = await this.db.query.tripInvitations.findFirst({
      where: eq(tripInvitations.token, input.token),
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation is no longer valid');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }

    const { status, data } = await this.supabaseFetch('/auth/v1/signup', {
      email: invite.email,
      password: input.password,
      data: { full_name: input.fullName },
    });

    if (status >= 400) {
      if (status === 422 || /already registered/i.test(data?.msg || '')) {
        throw new ConflictException('An account with this email already exists. Please log in instead.');
      }
      throw new BadRequestException(data?.error_description || data?.msg || 'Unable to create account');
    }

    if (!data.user) {
      throw new ServiceUnavailableException('Unable to create account at this time');
    }

    const profile = await this.profileSync.syncFromClaims({
      sub: data.user.id,
      email: invite.email,
      user_metadata: { full_name: input.fullName },
    });

    await (this.db
      .insert(tripMembers)
      .values({ tripId: invite.tripId, userId: profile.id, role: invite.role } as any) as any)
      .onConflictDoNothing({ target: [tripMembers.tripId, tripMembers.userId] });

    await (this.db
      .update(tripInvitations)
      .set({ status: InvitationStatus.ACCEPTED } as any) as any)
      .where(eq(tripInvitations.token, input.token));

    if (!data.access_token) {
      return {
        requiresEmailConfirmation: true,
        message: 'Account created and trip joined. Check your email to confirm your account before logging in.',
      };
    }

    return { user: profile, token: data.access_token };
  }
}
