import { SettlementsService, RawExpense } from './settlements.service';
import { Profile } from '@tripsync/types';

describe('SettlementsService - Debt Minimization Algorithm', () => {
  let service: SettlementsService;

  const mockUsers: Profile[] = [
    { id: 'user-a', email: 'a@test.com', fullName: 'Alice', avatarUrl: null, phone: null, createdAt: '', updatedAt: '' },
    { id: 'user-b', email: 'b@test.com', fullName: 'Bob', avatarUrl: null, phone: null, createdAt: '', updatedAt: '' },
    { id: 'user-c', email: 'c@test.com', fullName: 'Charlie', avatarUrl: null, phone: null, createdAt: '', updatedAt: '' },
    { id: 'user-d', email: 'd@test.com', fullName: 'Dave', avatarUrl: null, phone: null, createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    service = new SettlementsService();
  });

  it('should correctly calculate net balances when Alice pays for all equally', () => {
    // Alice pays 400 for 4 people (100 each)
    const expenses: RawExpense[] = [
      {
        id: 'exp-1',
        paidById: 'user-a',
        amount: 400,
        currency: 'INR',
        participants: [
          { userId: 'user-a', shareAmount: 100 },
          { userId: 'user-b', shareAmount: 100 },
          { userId: 'user-c', shareAmount: 100 },
          { userId: 'user-d', shareAmount: 100 },
        ],
      },
    ];

    const balances = service.calculateNetBalances(mockUsers, expenses);
    expect(balances.get('user-a')).toBe(300); // 400 - 100
    expect(balances.get('user-b')).toBe(-100);
    expect(balances.get('user-c')).toBe(-100);
    expect(balances.get('user-d')).toBe(-100);

    const transfers = service.optimizeSettlements(mockUsers, expenses);
    expect(transfers.length).toBe(3);
    // B, C, D each pay Alice 100
    const totalTransferredToA = transfers
      .filter((t) => t.toUserId === 'user-a')
      .reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferredToA).toBe(300);
  });

  it('should optimize multi-payer circular debts into minimal direct payments', () => {
    // Problem scenario from spec:
    // A paid 6000, B paid 2000, C paid 1000, D paid 500. Total = 9500.
    // Equal 4-way share = 2375 each.
    // Net:
    // A: 6000 - 2375 = +3625
    // B: 2000 - 2375 = -375
    // C: 1000 - 2375 = -1375
    // D: 500 - 2375 = -1875
    // Sum of debtors: 375 + 1375 + 1875 = 3625 == A's credit
    const expenses: RawExpense[] = [
      {
        id: 'exp-1',
        paidById: 'user-a',
        amount: 6000,
        currency: 'INR',
        participants: mockUsers.map((u) => ({ userId: u.id, shareAmount: 1500 })),
      },
      {
        id: 'exp-2',
        paidById: 'user-b',
        amount: 2000,
        currency: 'INR',
        participants: mockUsers.map((u) => ({ userId: u.id, shareAmount: 500 })),
      },
      {
        id: 'exp-3',
        paidById: 'user-c',
        amount: 1000,
        currency: 'INR',
        participants: mockUsers.map((u) => ({ userId: u.id, shareAmount: 250 })),
      },
      {
        id: 'exp-4',
        paidById: 'user-d',
        amount: 500,
        currency: 'INR',
        participants: mockUsers.map((u) => ({ userId: u.id, shareAmount: 125 })),
      },
    ];

    const transfers = service.optimizeSettlements(mockUsers, expenses);
    // At most 3 transfers needed to settle all debts
    expect(transfers.length).toBeLessThanOrEqual(3);

    const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(Math.round(totalTransferred)).toBe(3625);

    // All transfers must go to Alice because she is the only net creditor
    transfers.forEach((t) => {
      expect(t.toUserId).toBe('user-a');
    });
  });

  it('should return empty transfers when everyone is already even', () => {
    const expenses: RawExpense[] = [
      {
        id: 'exp-1',
        paidById: 'user-a',
        amount: 100,
        currency: 'INR',
        participants: [{ userId: 'user-a', shareAmount: 100 }],
      },
    ];

    const transfers = service.optimizeSettlements(mockUsers, expenses);
    expect(transfers.length).toBe(0);
  });
});
