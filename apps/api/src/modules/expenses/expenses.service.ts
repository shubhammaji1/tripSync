import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { CreateExpenseInput, UpdateExpenseInput } from '@tripsync/validation';
import { ExpenseCategory, SplitType } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { expenses, expenseParticipants } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';
import { SEED_TRIP_ID, SEED_USERS } from '../../database/seed';

@Injectable()
export class ExpensesService {
  private mockExpenses: Map<string, any[]> = new Map();

  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {
    this.initMockExpenses();
  }

  private initMockExpenses() {
    this.mockExpenses.set(SEED_TRIP_ID, [
      {
        id: 'exp-1',
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[0].id,
        paidBy: SEED_USERS[0],
        title: 'Summit Hermon Hotel Advance Booking',
        amount: 6000,
        currency: 'INR',
        category: ExpenseCategory.ACCOMMODATION,
        splitType: SplitType.EQUAL,
        date: '2026-09-10',
        receiptUrl: null,
        notes: 'Room booking for 6 members',
        participants: SEED_USERS.map((u) => ({
          id: `ep-${u.id}-1`,
          userId: u.id,
          user: u,
          shareAmount: 1000,
        })),
        createdAt: '2026-09-10T14:30:00Z',
      },
      {
        id: 'exp-2',
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[1].id,
        paidBy: SEED_USERS[1],
        title: 'Toyota Innova Sightseeing Cab',
        amount: 2400,
        currency: 'INR',
        category: ExpenseCategory.TRANSPORT,
        splitType: SplitType.EQUAL,
        date: '2026-09-11',
        receiptUrl: null,
        notes: 'Tiger Hill and tea gardens cab',
        participants: SEED_USERS.map((u) => ({
          id: `ep-${u.id}-2`,
          userId: u.id,
          user: u,
          shareAmount: 400,
        })),
        createdAt: '2026-09-11T08:00:00Z',
      },
      {
        id: 'exp-3',
        tripId: SEED_TRIP_ID,
        paidById: SEED_USERS[2].id,
        paidBy: SEED_USERS[2],
        title: 'Glenary’s Bakery & Restaurant Group Dinner',
        amount: 3200,
        currency: 'INR',
        category: ExpenseCategory.FOOD,
        splitType: SplitType.EQUAL,
        date: '2026-09-11',
        receiptUrl: null,
        notes: 'Dinner & desserts',
        participants: SEED_USERS.map((u) => ({
          id: `ep-${u.id}-3`,
          userId: u.id,
          user: u,
          shareAmount: 533.33,
        })),
        createdAt: '2026-09-11T21:00:00Z',
      },
    ]);
  }

  async getTripExpenses(tripId: string) {
    if (this.db) {
      try {
        const result = await this.db.query.expenses.findMany({
          where: eq(expenses.tripId, tripId),
          orderBy: [desc(expenses.createdAt)],
          with: {
            paidBy: true,
            participants: { with: { user: true } },
          },
        });
        return result;
      } catch (err) {
        throw err;
      }
    }

    return this.mockExpenses.get(tripId) || [];
  }

  async createExpense(tripId: string, paidById: string, input: CreateExpenseInput) {
    if (this.db) {
      try {
        const [newExpense] = await (this.db.insert(expenses).values({
          tripId,
          paidById,
          title: input.title,
          amount: input.amount.toString(),
          currency: input.currency,
          category: input.category,
          splitType: input.splitType,
          date: input.date,
          receiptUrl: input.receiptUrl,
          notes: input.notes,
        } as any) as any).returning();

        for (const p of input.participants) {
          await (this.db.insert(expenseParticipants).values({
            expenseId: newExpense.id,
            userId: p.userId,
            shareAmount: p.shareAmount.toString(),
            percentage: p.percentage,
            shares: p.shares,
          } as any) as any);
        }

        return newExpense;
      } catch (err) {
        throw err;
      }
    }

    const payer = SEED_USERS.find((u) => u.id === paidById) || SEED_USERS[0];
    const newExp = {
      id: 'exp-' + Date.now(),
      tripId,
      paidById,
      paidBy: payer,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      splitType: input.splitType,
      date: input.date,
      receiptUrl: input.receiptUrl || null,
      notes: input.notes || null,
      participants: input.participants.map((p) => ({
        id: 'ep-' + Math.random().toString(36).substring(7),
        userId: p.userId,
        user: SEED_USERS.find((u) => u.id === p.userId) || { id: p.userId, fullName: 'Member' },
        shareAmount: p.shareAmount,
        percentage: p.percentage,
        shares: p.shares,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tripExps = this.mockExpenses.get(tripId) || [];
    tripExps.unshift(newExp);
    this.mockExpenses.set(tripId, tripExps);

    return newExp;
  }

  async deleteExpense(expenseId: string) {
    if (this.db) {
      try {
        await this.db.delete(expenses).where(eq(expenses.id, expenseId));
        return { success: true };
      } catch (err) {
        throw err;
      }
    }

    return { success: true };
  }

  async updateExpense(expenseId: string, input: UpdateExpenseInput) {
    if (this.db) {
      try {
        const { participants, ...expenseFields } = input;
        const [updated] = await (this.db.update(expenses).set({
          ...expenseFields,
          amount: expenseFields.amount !== undefined ? expenseFields.amount.toString() : undefined,
          updatedAt: new Date(),
        } as any) as any).where(eq(expenses.id, expenseId)).returning();
        if (updated && participants) {
          await this.db.delete(expenseParticipants).where(eq(expenseParticipants.expenseId, expenseId));
          await this.db.insert(expenseParticipants).values(participants.map((participant) => ({
            expenseId,
            userId: participant.userId,
            shareAmount: participant.shareAmount.toString(),
            percentage: participant.percentage,
            shares: participant.shares,
          })) as any);
        }
        if (updated) return updated;
      } catch (err) {
        throw err;
      }
    }

    for (const tripExpenses of this.mockExpenses.values()) {
      const index = tripExpenses.findIndex((expense) => expense.id === expenseId);
      if (index >= 0) {
        tripExpenses[index] = { ...tripExpenses[index], ...input, updatedAt: new Date().toISOString() };
        return tripExpenses[index];
      }
    }
    throw new NotFoundException(`Expense ${expenseId} not found`);
  }
}
