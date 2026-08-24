import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../database/database.module';
import { profiles } from '../database/schema';
import { Profile } from '@tripsync/types';

export interface SupabaseIdentityClaims {
  sub: string;
  email?: string;
  phone?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

/**
 * `profiles.id` mirrors Supabase `auth.users.id` 1:1 (see schema.ts comment).
 * Supabase Auth is the identity provider (per README §Security Architecture);
 * this service is the only place that writes to `profiles`, and it always
 * writes from verified claims - never from a seed list or client-supplied
 * body - so the row always reflects the real, current Supabase identity.
 */
@Injectable()
export class ProfileSyncService {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB) {}

  async syncFromClaims(claims: SupabaseIdentityClaims): Promise<Profile> {
    if (!claims.sub) {
      throw new ServiceUnavailableException('Identity claims are missing a subject');
    }
    if (!claims.email) {
      throw new ServiceUnavailableException('Authenticated session is missing an email claim');
    }

    const fullName = claims.user_metadata?.full_name ?? null;
    const avatarUrl = claims.user_metadata?.avatar_url ?? null;
    const phone = claims.phone ?? null;

    const updateSet: Record<string, unknown> = {
      email: claims.email,
      updatedAt: new Date(),
    };
    if (fullName) updateSet.fullName = fullName;
    if (avatarUrl) updateSet.avatarUrl = avatarUrl;
    if (phone) updateSet.phone = phone;

    try {
      const [row] = await (this.db
        .insert(profiles)
        .values({
          id: claims.sub,
          email: claims.email,
          fullName,
          avatarUrl,
          phone,
        } as any) as any)
        .onConflictDoUpdate({
          target: profiles.id,
          set: updateSet,
        })
        .returning();

      return {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        avatarUrl: row.avatarUrl,
        phone: row.phone,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };
    } catch (err) {
      // Deliberately NOT falling back to a mock/seed profile here - if the
      // database is unreachable, the request should fail loudly (503), not
      // silently proceed as a fabricated user.
      throw new ServiceUnavailableException('Unable to verify user profile at this time');
    }
  }
}
