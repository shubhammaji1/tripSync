import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { CreateTaskInput, UpdateTaskInput } from '@tripsync/validation';
import { TaskPriority, TaskStatus } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { tasks } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

@Injectable()
export class TasksService {
  private mockTasks: Map<string, any[]> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    this.initMockTasks();
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

  async getTripTasks(tripId: string) {
    if (this.db) {
      try {
        const result = await this.db.query.tasks.findMany({
          where: eq(tasks.tripId, tripId),
          orderBy: [desc(tasks.createdAt)],
          with: { assignedTo: true },
        });
        if (result && result.length > 0) return result;
      } catch (err) {
        console.warn('Tasks query fallback to mock:', err);
      }
    }

    return this.mockTasks.get(tripId) || [];
  }

  async createTask(tripId: string, input: CreateTaskInput) {
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
        console.warn('Task insert db error:', err);
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

  async updateTask(taskId: string, input: UpdateTaskInput) {
    if (this.db) {
      try {
        const [updated] = await (this.db.update(tasks)
          .set({ ...input, updatedAt: new Date() } as any) as any)
          .where(eq(tasks.id, taskId))
          .returning();
        return updated;
      } catch (err) {
        console.warn('Task update db error:', err);
      }
    }

    return { id: taskId, ...input, updatedAt: new Date().toISOString() };
  }

  async deleteTask(taskId: string) {
    if (this.db) {
      try {
        await this.db.delete(tasks).where(eq(tasks.id, taskId));
        return { success: true };
      } catch (err) {
        console.warn('Task delete db error:', err);
      }
    }

    return { success: true };
  }
}
