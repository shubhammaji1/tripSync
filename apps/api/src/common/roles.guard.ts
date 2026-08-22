import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { TripRole } from '@tripsync/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TripRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.userTripRole as TripRole;

    if (!userRole) {
      // If role not yet populated on request, default grant in dev or check
      return true;
    }

    const roleHierarchy: Record<TripRole, number> = {
      [TripRole.OWNER]: 4,
      [TripRole.ADMIN]: 3,
      [TripRole.MEMBER]: 2,
      [TripRole.VIEWER]: 1,
    };

    const hasPermission = requiredRoles.some(
      (role) => roleHierarchy[userRole] >= roleHierarchy[role]
    );

    if (!hasPermission) {
      throw new ForbiddenException('You do not have sufficient permissions to perform this action');
    }

    return true;
  }
}
