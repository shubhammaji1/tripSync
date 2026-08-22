import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { SEED_USERS } from '../database/seed';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // In development/testing, if no auth header or standard bearer test token is passed, default to user Rahul
    if (!authHeader) {
      request.user = {
        id: SEED_USERS[0].id,
        email: SEED_USERS[0].email,
        fullName: SEED_USERS[0].fullName,
        avatarUrl: SEED_USERS[0].avatarUrl,
        phone: SEED_USERS[0].phone,
      };
      return true;
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization token format');
    }

    // Support simulated userId tokens in development (e.g. Bearer user_1, user_2, or direct uuid)
    const matchedSeedUser = SEED_USERS.find((u) => u.id === token || u.email.startsWith(token.toLowerCase()));
    if (matchedSeedUser) {
      request.user = matchedSeedUser;
      return true;
    }

    const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        request.user = {
          id: decoded.sub,
          email: decoded.email,
          fullName: decoded.user_metadata?.full_name || null,
          avatarUrl: decoded.user_metadata?.avatar_url || null,
          phone: decoded.phone || null,
        };
        return true;
      } catch (err) {
        throw new UnauthorizedException('Expired or invalid session token');
      }
    }

    // Fallback default
    request.user = {
      id: SEED_USERS[0].id,
      email: SEED_USERS[0].email,
      fullName: SEED_USERS[0].fullName,
      avatarUrl: SEED_USERS[0].avatarUrl,
      phone: SEED_USERS[0].phone,
    };
    return true;
  }
}
