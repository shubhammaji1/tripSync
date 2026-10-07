import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateExpenseInput, UpdateExpenseInput } from '@tripsync/validation';
import { TripRole } from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { expenses, expenseParticipants, trips } from '../../database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TripAccessService } from '../../common/trip-access.service';

@Injectable()
export class ExpensesService {
  constructor(@Inject(DRIZZLE_PROVIDER) private db: DrizzleDB, private access: TripAccessService) {}
  async getTripExpenses(tripId: string, userId: string) {
    await this.access.requireMember(tripId, userId);
    return this.db.query.expenses.findMany({ where: eq(expenses.tripId, tripId),
      orderBy: [desc(expenses.createdAt)], with: { paidBy: true, participants: { with: { user: true } } } });
  }
  private async validate(tripId: string, input: any, db = this.db) {
    const trip = await db.query.trips.findFirst({ where: eq(trips.id, tripId), with: { members: true } });
    if (!trip) throw new NotFoundException('Trip not found');
    const ids = new Set([trip.ownerId, ...trip.members.map(m => m.userId)]);
    if (!ids.has(input.paidById) || input.participants.some(p => !ids.has(p.userId)))
      throw new BadRequestException('Payer and participants must belong to this trip');
    if (input.currency !== trip.currency) throw new BadRequestException('Expense currency must match the trip currency');
    const participantIds = input.participants.map(p => p.userId);
    const cents = (value: number) => Math.round(Number(value) * 100);
    if (!participantIds.length || new Set(participantIds).size !== participantIds.length ||
      input.participants.reduce((sum, p) => sum + cents(p.shareAmount), 0) !== cents(input.amount))
      throw new BadRequestException('Unique participant shares must sum exactly to the total');
  }
  async createExpense(tripId: string, userId: string, input: CreateExpenseInput) {
    await this.access.requireMember(tripId, userId, true);
    const paidById = input.paidById || userId;
    return this.db.transaction(async tx => {
      await tx.select().from(trips).where(eq(trips.id, tripId)).for('update');
      await this.validate(tripId, { ...input, paidById }, tx as any);
      const { participants, ...fields } = input;
      const [expense] = await tx.insert(expenses).values({ ...fields, tripId, paidById, amount: input.amount.toFixed(2) }).returning();
      await tx.insert(expenseParticipants).values(participants.map(p => ({ ...p, expenseId: expense.id, shareAmount: p.shareAmount.toFixed(2) })));
      return expense;
    });
  }
  private async requireManage(tripId: string, expenseId: string, userId: string) {
    const { role } = await this.access.requireMember(tripId, userId, true);
    const expense = await this.db.query.expenses.findFirst({ where: and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)), with: { participants: true } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.paidById !== userId && role !== TripRole.OWNER && role !== TripRole.ADMIN)
      throw new ForbiddenException('Only the payer or trip managers can change this expense');
    return expense;
  }
  async updateExpense(tripId: string, expenseId: string, userId: string, input: UpdateExpenseInput) {
    await this.requireManage(tripId, expenseId, userId);
    return this.db.transaction(async tx => {
      await tx.select().from(trips).where(eq(trips.id, tripId)).for('update');
      await tx.select().from(expenses).where(eq(expenses.id, expenseId)).for('update');
      const existing = await tx.query.expenses.findFirst({ where: eq(expenses.id, expenseId), with: { participants: true } });
      if (!existing) throw new NotFoundException('Expense not found');
      await this.validate(tripId, { ...existing, ...input }, tx as any);
      const { participants, ...fields } = input;
      const [expense] = await tx.update(expenses).set({ ...fields, amount: input.amount === undefined ? undefined : input.amount.toFixed(2), updatedAt: new Date() } as any)
        .where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId))).returning();
      if (participants) {
        await tx.delete(expenseParticipants).where(eq(expenseParticipants.expenseId, expenseId));
        await tx.insert(expenseParticipants).values(participants.map(p => ({ ...p, expenseId, shareAmount: p.shareAmount.toFixed(2) })));
      }
      return expense;
    });
  }
  async deleteExpense(tripId: string, expenseId: string, userId: string) {
    await this.requireManage(tripId, expenseId, userId);
    await this.db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)));
    return { success: true };
  }
}
