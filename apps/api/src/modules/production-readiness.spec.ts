import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { ExpensesService } from './expenses/expenses.service';
import { SettlementsService } from './settlements/settlements.service';
import { TrailWatchService } from './trailwatch/trailwatch.service';
import { CollaborationService } from './collaboration/collaboration.module';
import { TripAccessService } from '../common/trip-access.service';
import { TripRole, ExpenseCategory, SplitType, TrailReportCategory, TrailWatchSeverity, RouteStatus } from '@tripsync/types';

const owner = '10000000-0000-4000-8000-000000000001';
const member = '10000000-0000-4000-8000-000000000002';
const viewer = '10000000-0000-4000-8000-000000000003';
const outsider = '10000000-0000-4000-8000-000000000004';
const tripId = '20000000-0000-4000-8000-000000000001';
const otherTrip = '20000000-0000-4000-8000-000000000002';

describe('Production data and authorization regressions', () => {
  let pg: PGlite, db: any, access: TripAccessService, expenses: ExpensesService;
  const realtime = { broadcastTripEvent: jest.fn() };
  beforeAll(async () => {
    pg = new PGlite();
    const directory = join(__dirname, '../database/migrations');
    for (const file of readdirSync(directory).filter(f => f.endsWith('.sql')).sort()) {
      await pg.exec(readFileSync(join(directory, file), 'utf8'));
    }
    db = drizzle(pg, { schema });
    await db.insert(schema.profiles).values([owner, member, viewer, outsider].map((id, i) => ({ id, email: `test${i}@example.com`, fullName: `Traveler ${i}` })));
    await db.insert(schema.trips).values([tripId, otherTrip].map(id => ({ id, name: 'Kyoto trip', destination: 'Kyoto, Japan', destinationLat: 35.0116, destinationLng: 135.7681, startDate: '2026-10-06', endDate: '2026-10-09', ownerId: owner, currency: 'INR' })));
    await db.insert(schema.tripMembers).values([{ tripId, userId: owner, role: TripRole.OWNER }, { tripId, userId: member, role: TripRole.MEMBER }, { tripId, userId: viewer, role: TripRole.VIEWER }]);
    access = new TripAccessService(db);
    expenses = new ExpensesService(db, access);
  }, 60000);
  afterAll(async () => { await pg?.close(); });

  const expense = () => ({ title: 'Shared meal', amount: 100, currency: 'INR', category: ExpenseCategory.FOOD, splitType: SplitType.EQUAL, date: '2026-10-06', paidById: owner, participants: [{ userId: owner, shareAmount: 50 }, { userId: member, shareAmount: 50 }] });

  it('runs all migrations on an empty database, including TrailWatch and collaboration tables', async () => {
    const result = await pg.query<{ count: number }>("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_name IN ('chat_messages','trip_routes','route_segments','trail_reports','weather_snapshots','trailwatch_alerts')");
    expect(result.rows[0].count).toBe(6);
  });
  it('allows viewers to read but rejects viewer writes and outsiders', async () => {
    await expect(expenses.getTripExpenses(tripId, viewer)).resolves.toEqual([]);
    await expect(expenses.createExpense(tripId, viewer, expense())).rejects.toThrow('permission');
    await expect(expenses.getTripExpenses(tripId, outsider)).rejects.toThrow('permission');
  });
  it('rejects foreign trip participants and duplicate splits', async () => {
    await expect(expenses.createExpense(tripId, member, { ...expense(), participants: [{ userId: outsider, shareAmount: 100 }] })).rejects.toThrow('belong');
    await expect(expenses.createExpense(tripId, member, { ...expense(), participants: [{ userId: member, shareAmount: 50 }, { userId: member, shareAmount: 50 }] })).rejects.toThrow('Unique');
  });
  it('persists the selected payer and rejects an amount-only edit that breaks shares', async () => {
    const saved = await expenses.createExpense(tripId, member, expense());
    expect(saved.paidById).toBe(owner);
    await expect(expenses.updateExpense(tripId, saved.id, owner, { amount: 120 })).rejects.toThrow('sum exactly');
    expect((await expenses.getTripExpenses(tripId, owner))[0].amount).toBe('100.00');
  });
  it('rolls back the expense if a participant insert fails', async () => {
    await pg.exec("CREATE FUNCTION reject_participant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated participant failure'; END $$; CREATE TRIGGER reject_participant BEFORE INSERT ON expense_participants FOR EACH ROW EXECUTE FUNCTION reject_participant();");
    const before = (await expenses.getTripExpenses(tripId, owner)).length;
    await expect(expenses.createExpense(tripId, member, expense())).rejects.toThrow();
    expect((await expenses.getTripExpenses(tripId, owner)).length).toBe(before);
    await pg.exec('DROP TRIGGER reject_participant ON expense_participants; DROP FUNCTION reject_participant();');
  });
  it('deducts partial and completed payments and prevents a duplicate overpayment', async () => {
    const settlements = new SettlementsService(db);
    const payload = { fromUserId: member, toUserId: owner, amount: 20, currency: 'INR' };
    await settlements.recordSettlement(tripId, member, payload);
    let ledger = await settlements.getTripSettlements(tripId, owner);
    expect(ledger.optimizedTransfers[0].amount).toBe(30);
    await settlements.recordSettlement(tripId, member, { ...payload, amount: 30 });
    ledger = await settlements.getTripSettlements(tripId, owner);
    expect(ledger.optimizedTransfers).toEqual([]);
    await expect(settlements.recordSettlement(tripId, member, payload)).rejects.toThrow('outstanding');
  });
  it('persists chat between independent clients and enforces announcement roles', async () => {
    const first = new CollaborationService(db, access, realtime as any);
    const second = new CollaborationService(db, access, realtime as any);
    await first.send(tripId, { id: member, fullName: 'Member' }, { content: 'Meet at Kyoto station', isAnnouncement: false });
    expect((await second.messages(tripId, viewer))[0].content).toBe('Meet at Kyoto station');
    await expect(first.send(tripId, { id: member }, { content: 'Forged announcement', isAnnouncement: true })).rejects.toThrow('managers');
    await expect(first.messages(tripId, outsider)).rejects.toThrow('permission');
  });
  it('keeps protected document codes on the server until the PIN is verified', async () => {
    const service = new CollaborationService(db, access, realtime as any);
    const saved = await service.addDocument(tripId, owner, { title: 'Rail ticket', category: 'TRANSPORT', provider: 'Rail', referenceNumber: 'SECRET-123', isLocked: true, pin: '654321' });
    const list = await service.listDocuments(tripId, member);
    expect(list[0].referenceNumber).toBe('');
    expect(list[0]).not.toHaveProperty('pinDigest');
    await expect(service.unlock(tripId, saved.id, member, '123456')).rejects.toThrow('PIN');
    expect((await service.unlock(tripId, saved.id, member, '654321')).referenceNumber).toBe('SECRET-123');
    await expect(service.unlock(otherTrip, saved.id, owner, '654321')).rejects.toThrow('not found');
  });
  it('persists reports and alerts atomically and scopes acknowledgments to the trip', async () => {
    const service = new TrailWatchService(db, realtime as any);
    const report = await service.createReport(tripId, member, { title: 'Road blocked', description: 'A fallen tree blocks this road.', category: TrailReportCategory.ROAD_BLOCKED, severity: TrailWatchSeverity.HIGH, latitude: 35.0116, longitude: 135.7681 });
    const alerts = await service.getAlerts(tripId);
    expect(alerts[0].reportId).toBe(report.id);
    expect(alerts[0].id).toMatch(/^[0-9a-f-]{36}$/);
    await expect(service.acknowledgeAlert(otherTrip, alerts[0].id, owner)).rejects.toThrow('not found');
    expect((await service.acknowledgeAlert(tripId, alerts[0].id, member)).isAcknowledged).toBe(true);
  });
  it('does not substitute Darjeeling or a safe status for an unmonitored trip', async () => {
    const service = new TrailWatchService(db);
    const overview = await service.getOverview(otherTrip);
    expect(overview.destination).toBe('Kyoto, Japan');
    expect(overview.latestWeather).toBeNull();
    expect(overview.overallStatus).toBe(RouteStatus.UNKNOWN);
    expect(overview.routes).toEqual([]);
  });
  it('surfaces database failure instead of demo data', async () => {
    const broken = { query: { tripRoutes: { findMany: jest.fn().mockRejectedValue(new Error('database failure')) } } };
    await expect(new TrailWatchService(broken as any).getRoutes(tripId)).rejects.toThrow('database failure');
  });
});
