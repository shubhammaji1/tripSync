import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  BalanceSummary,
  OptimizedTransfer,
  Profile,
  SettlementStatus,
} from '@tripsync/types';
import { DRIZZLE_PROVIDER, DrizzleDB } from '../../database/database.module';
import { settlements, profiles, expenses, expenseParticipants, tripMembers } from '../../database/schema';
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
    allExpenses: RawExpense[]
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

    return netBalances;
  }

  /**
   * Greedy Min-Cash-Flow Settlement Algorithm.
   * Reduces an N*(N-1) network of reciprocal debts to at most N-1 transactions.
   */
  optimizeSettlements(
    allMembers: Profile[],
    allExpenses: RawExpense[],
    currency: string = 'INR'
  ): OptimizedTransfer[] {
    const memberMap = new Map<string, Profile>(allMembers.map((m) => [m.id, m]));
    const netBalances = this.calculateNetBalances(allMembers, allExpenses);

    // Separate into debtors (negative balance) and creditors (positive balance)
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    netBalances.forEach((balance, userId) => {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ userId, amount: -rounded });
      } else if (rounded > 0.01) {
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

  /**
   * Get settlements and optimized transfers for a trip
   */
  async getTripSettlements(tripId: string) {
    if (this.db) {
      try {
        // Query members from database
        const membersResult = await this.db.query.tripMembers.findMany({
          where: eq(tripMembers.tripId, tripId),
          with: { user: true },
        });
        const membersList = membersResult.map((m) => m.user as unknown as Profile);

        // Query expenses and participants
        const expensesResult = await this.db.query.expenses.findMany({
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

        const balances = this.generateBalanceSummaries(membersList, rawExpenses);
        const optimizedTransfers = this.optimizeSettlements(membersList, rawExpenses);

        const existingSettlements = await this.db.query.settlements.findMany({
          where: eq(settlements.tripId, tripId),
          with: { fromUser: true, toUser: true },
        });

        return {
          balances,
          optimizedTransfers,
          settlements: existingSettlements,
        };
      } catch (err) {
        console.warn('Database query fallback to mock data:', err);
      }
    }

    // Mock fallback for quick offline dev / testing
    const defaultProfiles: Profile[] = SEED_USERS.map((u) => ({
      ...u,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    }));

    const mockExpenses: RawExpense[] = [
      {
        id: 'exp-1',
        paidById: defaultProfiles[0].id, // Rahul paid ₹6,000 (equal split 6 members = 1000 each)
        amount: 6000,
        currency: 'INR',
        participants: defaultProfiles.map((p) => ({ userId: p.id, shareAmount: 1000 })),
      },
      {
        id: 'exp-2',
        paidById: defaultProfiles[1].id, // Shubham paid ₹2,400 (equal split 6 members = 400 each)
        amount: 2400,
        currency: 'INR',
        participants: defaultProfiles.map((p) => ({ userId: p.id, shareAmount: 400 })),
      },
      {
        id: 'exp-3',
        paidById: defaultProfiles[2].id, // Priya paid ₹3,200 (equal split 6 members = 533.33 each)
        amount: 3200,
        currency: 'INR',
        participants: defaultProfiles.map((p) => ({ userId: p.id, shareAmount: 533.33 })),
      },
    ];

    const balances = this.generateBalanceSummaries(defaultProfiles, mockExpenses);
    const optimizedTransfers = this.optimizeSettlements(defaultProfiles, mockExpenses);

    return {
      balances,
      optimizedTransfers,
      settlements: [],
    };
  }

  /**
   * Mark a debt or settlement as settled
   */
  async recordSettlement(tripId: string, payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency?: string;
    notes?: string;
  }) {
    if (this.db) {
      const [newSettlement] = await (this.db.insert(settlements).values({
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
    }

    return {
      id: 'settle-' + Date.now(),
      tripId,
      ...payload,
      status: SettlementStatus.SETTLED,
      settledAt: new Date().toISOString(),
    };
  }
}
