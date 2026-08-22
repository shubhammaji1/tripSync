import { Injectable, Inject, Optional } from '@nestjs/common';
import { ExpenseCategory, TripAnalytics } from '@tripsync/types';
import { ExpensesService } from '../expenses/expenses.service';
import { SettlementsService } from '../settlements/settlements.service';
import { TripsService } from '../trips/trips.service';
import { MembersService } from '../members/members.service';
import { SEED_USERS } from '../../database/seed';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly settlementsService: SettlementsService,
    private readonly tripsService: TripsService,
    private readonly membersService: MembersService
  ) {}

  async getTripAnalytics(tripId: string): Promise<TripAnalytics> {
    const rawExpenses = await this.expensesService.getTripExpenses(tripId);
    const membersData = await this.membersService.getTripMembers(tripId);
    const membersList = membersData.map((m: any) => m.user || m);

    // Calculate total spend
    let totalSpent = 0;
    const categoryTotals: Record<ExpenseCategory, number> = {
      [ExpenseCategory.ACCOMMODATION]: 0,
      [ExpenseCategory.TRANSPORT]: 0,
      [ExpenseCategory.FOOD]: 0,
      [ExpenseCategory.ACTIVITIES]: 0,
      [ExpenseCategory.SHOPPING]: 0,
      [ExpenseCategory.ENTERTAINMENT]: 0,
      [ExpenseCategory.EMERGENCY]: 0,
      [ExpenseCategory.OTHER]: 0,
    };

    const dailyTotals: Record<string, number> = {};

    for (const exp of rawExpenses) {
      const amount = Number(exp.amount);
      totalSpent += amount;

      const cat = exp.category as ExpenseCategory;
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amount;
      } else {
        categoryTotals[ExpenseCategory.OTHER] += amount;
      }

      const dateStr = exp.date;
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + amount;
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .filter(([_, amt]) => amt > 0)
      .map(([cat, amt]) => ({
        category: cat as ExpenseCategory,
        amount: Math.round(amt * 100) / 100,
        percentage: totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const dailySpending = Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate member spending
    const balances = this.settlementsService.generateBalanceSummaries(membersList, rawExpenses.map((e: any) => ({
      id: e.id,
      paidById: e.paidById,
      amount: Number(e.amount),
      currency: e.currency,
      participants: (e.participants || []).map((p: any) => ({
        userId: p.userId,
        shareAmount: Number(p.shareAmount),
      })),
    })));

    const memberSpending = balances.map((b) => ({
      userId: b.userId,
      userName: b.user.fullName || b.user.email,
      paidAmount: b.totalPaid,
      shareAmount: b.totalOwed,
      netBalance: b.netBalance,
    }));

    const budget = 35000;
    const remainingBudget = Math.max(0, budget - totalSpent);

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      budget,
      remainingBudget,
      currency: 'INR',
      categoryBreakdown,
      memberSpending,
      dailySpending,
    };
  }
}
