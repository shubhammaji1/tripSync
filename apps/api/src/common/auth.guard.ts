import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ProfileSyncService } from './profile-sync.service';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  aud?: string;
  exp: number;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

/**
 * Verifies the Supabase session JWT sent as `Authorization: Bearer <token>`.
 *
 * This guard has exactly one source of identity: a token signed by Supabase
 * Auth with SUPABASE_JWT_SECRET. There is intentionally no fallback path -
 * no "no header -> default user", no seed-user token matching, no unsigned
 * `user_token_<id>` acceptance. Every branch that cannot cryptographically
 * verify the caller throws UnauthorizedException.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly profileSync: ProfileSyncService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header. Expected: Bearer <token>');
    }

    const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      // Fail closed. There is no "default user" to fall back to - if the
      // server isn't configured to verify sessions, nothing is authenticated.
      throw new UnauthorizedException('Authentication is not configured on the server');
    }

    let decoded: SupabaseJwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as SupabaseJwtPayload;
    } catch {
      throw new UnauthorizedException('Expired or invalid session token');
    }

    if (!decoded.sub) {
      throw new UnauthorizedException('Session token is missing a subject claim');
    }
    // Supabase issues "authenticated" as the audience for real user sessions.
    if (decoded.aud && decoded.aud !== 'authenticated') {
      throw new UnauthorizedException('Token is not a valid user session token');
    }

    const profile = await this.profileSync.syncFromClaims({
      sub: decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      user_metadata: decoded.user_metadata,
    });

    request.user = profile;
    request.supabaseUserId = decoded.sub;
    return true;
  }
}
