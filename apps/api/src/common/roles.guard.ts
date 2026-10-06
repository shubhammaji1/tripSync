import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { TripRole } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../database/database.module';
import { trips, tripMembers } from '../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TripRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.id) {
      throw new ForbiddenException('User is not authenticated');
    }

    const tripId = request.params?.tripId || request.body?.tripId || request.query?.tripId;
    if (!tripId) {
      throw new ForbiddenException('Trip context is required for role verification');
    }

    let userRole = request.userTripRole as TripRole | undefined;

    if (!userRole && this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
      });

      if (!trip) {
        throw new NotFoundException(`Trip ${tripId} not found`);
      }

      if (trip.ownerId === user.id) {
        userRole = TripRole.OWNER;
      } else {
        const member = await this.db.query.tripMembers.findFirst({
          where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, user.id)),
        });
        if (member) {
          userRole = member.role as TripRole;
        }
      }
      request.userTripRole = userRole;
    }

    // Fail closed: deny if user has no role or is not a member of the trip
    if (!userRole) {
      throw new ForbiddenException('You do not have permission or role in this trip');
    }

    const roleHierarchy: Record<TripRole, number> = {
      [TripRole.OWNER]: 4,
      [TripRole.ADMIN]: 3,
      [TripRole.MEMBER]: 2,
      [TripRole.VIEWER]: 1,
    };

    const hasPermission = requiredRoles.some(
      (role) => (roleHierarchy[userRole!] || 0) >= roleHierarchy[role]
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have sufficient permissions to perform this action');
    }

    return true;
  }
}
