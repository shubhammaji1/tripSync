import { Injectable, Inject, Optional, NotFoundException, ForbiddenException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import {
  BalanceSummary,
  OptimizedTransfer,
  Profile,
  SettlementStatus,
  TripRole,
} from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { settlements, profiles, expenses, expenseParticipants, tripMembers, trips } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { SEED_USERS } from '../../database/seed';

export interface RawExpense {
  id: string;
  paidById: string;
  amount: number;
  currency: string;
  participants: {
    userId: string;
    shareAmount: number;
  }[];
}

@Injectable()
export class SettlementsService {
  constructor(
    @Optional() @Inject(DRIZZLE_PROVIDER) private db?: DrizzleDB
  ) {}

  /**
   * Calculates net balances for all members given a list of expenses and splits.
   * Net Balance = Total Paid - Total Share Owed
   * Positive net balance => User is a creditor (should receive money)
   * Negative net balance => User is a debtor (owes money)
   */
  calculateNetBalances(
    allMembers: Profile[],
    allExpenses: RawExpense[],
    recorded: { fromUserId: string; toUserId: string; amount: number | string }[] = []
  ): Map<string, number> {
    const netBalances = new Map<string, number>();

    // Initialize all members with 0
    for (const member of allMembers) {
      netBalances.set(member.id, 0);
    }

    for (const expense of allExpenses) {
      const payerId = expense.paidById;
      const expenseTotal = Number(expense.amount);

      // Payer gets credit for total expense amount
      const currentPayerBalance = netBalances.get(payerId) || 0;
      netBalances.set(payerId, currentPayerBalance + expenseTotal);

      // Each participant owes their share
      for (const participant of expense.participants) {
        const participantId = participant.userId;
        const shareAmount = Number(participant.shareAmount);
        const currentPartBalance = netBalances.get(participantId) || 0;
        netBalances.set(participantId, currentPartBalance - shareAmount);
      }
    }

    for (const transfer of recorded) {
      const amount = Number(transfer.amount);
      netBalances.set(transfer.fromUserId, (netBalances.get(transfer.fromUserId) || 0) + amount);
      netBalances.set(transfer.toUserId, (netBalances.get(transfer.toUserId) || 0) - amount);
    }
    return new Map([...netBalances].map(([id, amount]) => [id, Math.round(amount * 100) / 100]));
  }

  /**
   * Greedy Min-Cash-Flow Settlement Algorithm.
   * Reduces an N*(N-1) network of reciprocal debts to at most N-1 transactions.
   */
  optimizeSettlements(
    allMembers: Profile[],
    allExpenses: RawExpense[],
    currency: string = 'INR',
    recorded: { fromUserId: string; toUserId: string; amount: number | string }[] = []
  ): OptimizedTransfer[] {
    const memberMap = new Map<string, Profile>(allMembers.map((m) => [m.id, m]));
    const netBalances = this.calculateNetBalances(allMembers, allExpenses, recorded);

    // Separate into debtors (negative balance) and creditors (positive balance)
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    netBalances.forEach((balance, userId) => {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded <= -0.01) {
        debtors.push({ userId, amount: -rounded });
      } else if (rounded >= 0.01) {
        creditors.push({ userId, amount: rounded });
      }
    });

    const transfers: OptimizedTransfer[] = [];

    // Sort descending by amount
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);
      const roundedAmount = Math.round(settlementAmount * 100) / 100;

      if (roundedAmount > 0) {
        const fromUser = memberMap.get(debtor.userId) || {
          id: debtor.userId,
          email: 'user@tripsync.io',
          fullName: 'Trip Member',
          avatarUrl: null,
          phone: null,
          createdAt: '',
          updatedAt: '',
        };

        const toUser = memberMap.get(creditor.userId) || {
          id: creditor.userId,
          email: 'user@tripsync.io',
          fullName: 'Trip Member',
          avatarUrl: null,
          phone: null,
          createdAt: '',
          updatedAt: '',
        };

        transfers.push({
          fromUserId: debtor.userId,
          fromUser,
          toUserId: creditor.userId,
          toUser,
          amount: roundedAmount,
          currency,
        });
      }

      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      if (debtor.amount < 0.01) {
        dIdx++;
      }
      if (creditor.amount < 0.01) {
        cIdx++;
      }
    }

    return transfers;
  }

  /**
   * Generates member balance summaries (Total Paid, Total Owed, Net Balance)
   */
  generateBalanceSummaries(
    allMembers: Profile[],
    allExpenses: RawExpense[]
  ): BalanceSummary[] {
    const memberMap = new Map<string, Profile>(allMembers.map((m) => [m.id, m]));
    const totalsPaid = new Map<string, number>();
    const totalsOwed = new Map<string, number>();

    for (const m of allMembers) {
      totalsPaid.set(m.id, 0);
      totalsOwed.set(m.id, 0);
    }

    for (const exp of allExpenses) {
      const payerId = exp.paidById;
      totalsPaid.set(payerId, (totalsPaid.get(payerId) || 0) + Number(exp.amount));

      for (const p of exp.participants) {
        totalsOwed.set(p.userId, (totalsOwed.get(p.userId) || 0) + Number(p.shareAmount));
      }
    }

    return allMembers.map((m) => {
      const paid = Math.round((totalsPaid.get(m.id) || 0) * 100) / 100;
      const owed = Math.round((totalsOwed.get(m.id) || 0) * 100) / 100;
      const net = Math.round((paid - owed) * 100) / 100;

      return {
        userId: m.id,
        user: memberMap.get(m.id) || m,
        totalPaid: paid,
        totalOwed: owed,
        netBalance: net,
      };
    });
  }

  private async verifyTripAccess(tripId: string, userId: string): Promise<any> {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: true },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

      const isOwner = trip.ownerId === userId;
      const isMember = (trip.members || []).some((m: any) => m.userId === userId);
      if (!isOwner && !isMember) {
        throw new ForbiddenException('You do not have permission to access settlements for this trip');
      }
      return trip;
    }
    return null;
  }

  /**
   * Get settlements and optimized transfers for a trip
   */
  async getTripSettlements(tripId: string, userId?: string, database = this.db) {
    if (userId) {
      await this.verifyTripAccess(tripId, userId);
    }

    if (database) {
      try {
        // Query members from database
        const membersResult = await database.query.tripMembers.findMany({
          where: eq(tripMembers.tripId, tripId),
          with: { user: true },
        });
        const membersList = membersResult.map((m) => m.user as unknown as Profile);

        // Query expenses and participants
        const expensesResult = await database.query.expenses.findMany({
          where: eq(expenses.tripId, tripId),
          with: { participants: true },
        });

        const rawExpenses: RawExpense[] = expensesResult.map((e) => ({
          id: e.id,
          paidById: e.paidById,
          amount: Number(e.amount),
          currency: e.currency,
          participants: e.participants.map((p) => ({
            userId: p.userId,
            shareAmount: Number(p.shareAmount),
          })),
        }));

        const trip = await database.query.trips.findFirst({ where: eq(trips.id, tripId), with: { owner: true } });
        if (!membersList.some(m => m.id === trip.ownerId)) membersList.push(trip.owner as unknown as Profile);
        const existingSettlements = await database.query.settlements.findMany({
          where: eq(settlements.tripId, tripId), with: { fromUser: true, toUser: true },
        });
        const recorded = existingSettlements.filter(s => s.status === SettlementStatus.SETTLED);
        if (rawExpenses.some(e => e.currency !== trip.currency) || recorded.some(s => s.currency !== trip.currency))
          throw new BadRequestException('Mixed currency ledger requires reconciliation');
        const net = this.calculateNetBalances(membersList, rawExpenses, recorded);
        const balances = this.generateBalanceSummaries(membersList, rawExpenses).map(b => ({ ...b, netBalance: net.get(b.userId) || 0 }));
        const optimizedTransfers = this.optimizeSettlements(membersList, rawExpenses, trip.currency, recorded);

        return {
          balances,
          optimizedTransfers,
          settlements: existingSettlements,
        };
      } catch (err) {
        throw err;
      }
    }

    throw new ServiceUnavailableException('Database unavailable');
  }

  async recordSettlement(tripId: string, userId: string, payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency?: string;
    notes?: string;
  }) {
    if (this.db) {
      const trip = await this.db.query.trips.findFirst({
        where: eq(trips.id, tripId),
        with: { members: true },
      });
      if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

      const isOwner = trip.ownerId === userId;
      const callerMembership = (trip.members || []).find((m: any) => m.userId === userId);
      if (!isOwner && !callerMembership) {
        throw new ForbiddenException('Caller is not a member of this trip or authorized to record settlements');
      }

      if (callerMembership?.role === TripRole.VIEWER && !isOwner) throw new ForbiddenException('Viewers cannot record settlements');
      if (payload.fromUserId === payload.toUserId || !Number.isFinite(payload.amount) || payload.amount <= 0) throw new BadRequestException('Invalid settlement');
      if ((payload.currency || 'INR') !== trip.currency) throw new BadRequestException('Currency must match the trip');
      const isAdmin = isOwner || callerMembership?.role === TripRole.ADMIN;
      const isParty = payload.fromUserId === userId || payload.toUserId === userId;
      if (!isAdmin && !isParty) {
        throw new ForbiddenException('Only the paying user, receiving user, or trip managers can record settlements');
      }

      const validFrom = trip.ownerId === payload.fromUserId || (trip.members || []).some((m: any) => m.userId === payload.fromUserId);
      const validTo = trip.ownerId === payload.toUserId || (trip.members || []).some((m: any) => m.userId === payload.toUserId);
      if (!validFrom || !validTo) {
        throw new ForbiddenException('Settlement parties must be members of this trip');
      }

      return this.db.transaction(async tx => {
      await tx.select().from(trips).where(eq(trips.id, tripId)).for('update');
      const ledger = await this.getTripSettlements(tripId, undefined, tx as any);
      const from = ledger.balances.find(b => b.userId === payload.fromUserId)?.netBalance || 0;
      const to = ledger.balances.find(b => b.userId === payload.toUserId)?.netBalance || 0;
      const amount = Math.round(payload.amount * 100);
      if (from >= 0 || to <= 0 || amount > Math.min(Math.round(-from * 100), Math.round(to * 100)))
        throw new BadRequestException('Payment exceeds the outstanding balance. Refresh settlements.');
      const [newSettlement] = await (tx.insert(settlements).values({
        tripId,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        amount: payload.amount.toString(),
        currency: payload.currency || 'INR',
        status: SettlementStatus.SETTLED,
        settledAt: new Date(),
        notes: payload.notes || 'Settled in TripSync',
      } as any) as any).returning();
      return newSettlement;
      });
    }

    throw new ServiceUnavailableException('Database unavailable');
  }
}
