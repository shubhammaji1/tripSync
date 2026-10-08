import { Injectable, Inject, Optional, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTaskInput, UpdateTaskInput } from '@tripsync/validation';
import { TaskPriority, TaskStatus } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tasks, trips, tripMembers } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

@Injectable()
export class TasksService {
  private mockTasks: Map<string, any[]> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    if (!this.db && process.env.NODE_ENV !== 'test') throw new Error('Database persistence is required; sample data is only available in tests');
    if (!this.db) this.initMockTasks();
  }

  private initMockTasks() {
    this.mockTasks.set(SEED_TRIP_ID, [
      {
        id: 'task-1',
        tripId: SEED_TRIP_ID,
        title: 'Confirm Toyota Innova cab pickup at Bagdogra Airport',
        description: 'Call driver Mr. Thapa to reconfirm flight IXB landing at 11:30 AM.',
        assignedToId: SEED_USERS[0].id,
        assignedTo: SEED_USERS[0],
        dueDate: '2026-09-09',
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'task-2',
        tripId: SEED_TRIP_ID,
        title: 'Book Himalayan Mountaineering Institute museum tickets',
        description: 'Book 6 student/adult entry tickets online.',
        assignedToId: SEED_USERS[1].id,
        assignedTo: SEED_USERS[1],
        dueDate: '2026-09-10',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        createdAt: '2026-08-02T00:00:00Z',
      },
      {
        id: 'task-3',
        tripId: SEED_TRIP_ID,
        title: 'Assemble First Aid & Mountain Motion Sickness Kit',
        description: 'Pack Avomine, Diamox, Band-aids, Pain relievers, and ORS sachets.',
        assignedToId: SEED_USERS[2].id,
        assignedTo: SEED_USERS[2],
        dueDate: '2026-09-08',
        priority: TaskPriority.HIGH,
        status: TaskStatus.DONE,
        createdAt: '2026-08-03T00:00:00Z',
      },
      {
        id: 'task-4',
        tripId: SEED_TRIP_ID,
        title: 'Download offline Google Maps & emergency contact list',
        description: 'Ensure offline area Darjeeling / Mirik / Ghoom is cached.',
        assignedToId: SEED_USERS[3].id,
        assignedTo: SEED_USERS[3],
        dueDate: '2026-09-09',
        priority: TaskPriority.URGENT,
        status: TaskStatus.TODO,
        createdAt: '2026-08-04T00:00:00Z',
      },
    ]);
  }

  private async verifyTripMember(tripId: string, userId: string): Promise<any> {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: true },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

      const isOwner = trip.ownerId === userId;
      const isMember = (trip.members || []).some((m: any) => m.userId === userId);
      if (!isOwner && !isMember) {
        throw new ForbiddenException('Unauthorized to modify tasks for this trip');
      }
      return trip;
    }
    return null;
  }

  async getTripTasks(tripId: string, userId?: string) {
    if (userId) {
      await this.verifyTripMember(tripId, userId);
    }

    if (this.db) {
      try {
        const result = await this.db.query.tasks.findMany({
          where: eq(tasks.tripId, tripId),
          orderBy: [desc(tasks.createdAt)],
          with: { assignedTo: true },
        });
        return result;
      } catch (err) {
        throw err;
      }
    }

    return this.mockTasks.get(tripId) || [];
  }

  async createTask(tripId: string, userId: string, input: CreateTaskInput) {
    await this.verifyTripMember(tripId, userId);

    if (this.db) {
      try {
        const [task] = await (this.db.insert(tasks).values({
          tripId,
          title: input.title,
          description: input.description,
          assignedToId: input.assignedToId,
          dueDate: input.dueDate,
          priority: input.priority,
          status: input.status,
        } as any) as any).returning();
        return task;
      } catch (err) {
        throw err;
      }
    }

    const assignee = SEED_USERS.find((u) => u.id === input.assignedToId) || null;
    const newTask = {
      id: 'task-' + Date.now(),
      tripId,
      ...input,
      assignedTo: assignee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tripTasks = this.mockTasks.get(tripId) || [];
    tripTasks.unshift(newTask);
    this.mockTasks.set(tripId, tripTasks);

    return newTask;
  }

  async updateTask(tripId: string, taskId: string, userId: string, input: UpdateTaskInput) {
    await this.verifyTripMember(tripId, userId);

    if (this.db) {
      try {
        const existing = await this.db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.tripId, tripId)),
        });
        if (!existing) throw new NotFoundException(`Task ${taskId} not found`);

        const [updated] = await (this.db.update(tasks)
          .set({ ...input, updatedAt: new Date() } as any) as any)
          .where(and(eq(tasks.id, taskId), eq(tasks.tripId, tripId)))
          .returning();
        return updated;
      } catch (err) {
        throw err;
      }
    }

    return { id: taskId, ...input, updatedAt: new Date().toISOString() };
  }

  async deleteTask(tripId: string, taskId: string, userId: string) {
    await this.verifyTripMember(tripId, userId);

    if (this.db) {
      try {
        const existing = await this.db.query.tasks.findFirst({
          where: and(eq(tasks.id, taskId), eq(tasks.tripId, tripId)),
        });
        if (!existing) throw new NotFoundException(`Task ${taskId} not found`);

        await this.db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.tripId, tripId)));
        return { success: true };
      } catch (err) {
        throw err;
      }
    }

    return { success: true };
  }
}
