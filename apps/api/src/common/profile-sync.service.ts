import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../database/database.module';
import { profiles } from '../database/schema';
import { eq } from 'drizzle-orm';
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
 * body - so the row always reflects the real, current identity.
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
      // 1. Check if profile exists by ID
      const existingById = await this.db.query.profiles.findFirst({
        where: eq(profiles.id, claims.sub),
      });

      if (existingById) {
        const [row] = await (this.db
          .update(profiles)
          .set(updateSet as any)
          .where(eq(profiles.id, claims.sub)) as any)
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
      }

      // 2. Check if profile exists by Email (e.g. from existing Supabase session or seed)
      const existingByEmail = await this.db.query.profiles.findFirst({
        where: eq(profiles.email, claims.email),
      });

      if (existingByEmail) {
        const [row] = await (this.db
          .update(profiles)
          .set(updateSet as any)
          .where(eq(profiles.id, existingByEmail.id)) as any)
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
      }

      // 3. Otherwise, insert new profile
      const [row] = await (this.db
        .insert(profiles)
        .values({
          id: claims.sub,
          email: claims.email,
          fullName,
          avatarUrl,
          phone,
        } as any) as any)
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
      throw err;
    }
  }
}
