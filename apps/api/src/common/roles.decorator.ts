import { SetMetadata } from '@nestjs/common';
import { TripRole } from '@tripsync/types';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: TripRole[]) => SetMetadata(ROLES_KEY, roles);
