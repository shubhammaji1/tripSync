import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TripRole } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../database/database.module';
import { trips, tripMembers } from '../database/schema';

@Injectable()
export class TripAccessService {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB) {}

  async requireMember(tripId: string, userId: string, write = false) {
    const trip = await this.db.query.trips.findFirst({ where: eq(trips.id, tripId) });
    if (!trip) throw new NotFoundException('Trip not found');
    const member = await this.db.query.tripMembers.findFirst({
      where: and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)),
    });
    const role = trip.ownerId === userId ? TripRole.OWNER : member?.role;
    if (!role || (write && role === TripRole.VIEWER)) {
      throw new ForbiddenException('You do not have permission for this trip');
    }
    return { trip, role };
  }
}
