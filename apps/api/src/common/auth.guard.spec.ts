import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { RealtimeGateway } from '../modules/realtime/realtime.gateway';

describe('Authenticated API and socket identity', () => {
  const id = '10000000-0000-4000-8000-000000000001';
  const profile = { id, fullName: 'Verified member' };
  const sync = { syncFromClaims: jest.fn().mockResolvedValue(profile) };
  const guard = new AuthGuard(new ConfigService({ SUPABASE_JWT_SECRET: 'test-session-secret' }), sync as any);
  const token = (claims: object) => jwt.sign({ sub: id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 60, ...claims }, 'test-session-secret');
  it('rejects missing, expired, unsigned and wrong-audience sessions', async () => {
    for (const authorization of [undefined, 'Bearer user_token_demo', `Bearer ${token({ exp: 1 })}`, `Bearer ${token({ aud: 'service_role' })}`]) {
      await expect(guard.authenticateRequest({ headers: { authorization } })).rejects.toThrow();
    }
  });
  it('requires an expiry claim and sets identity only from verified claims', async () => {
    const withoutExpiry = jwt.sign({ sub: id, aud: 'authenticated' }, 'test-session-secret');
    await expect(guard.authenticateRequest({ headers: { authorization: `Bearer ${withoutExpiry}` } })).rejects.toThrow();
    const request: any = { headers: { authorization: `Bearer ${token({})}` } };
    await expect(guard.authenticateRequest(request)).resolves.toBe(true);
    expect(request.user).toEqual(profile);
  });
  it('rejects unauthenticated socket rooms and enforces trip membership', async () => {
    const access = { requireMember: jest.fn().mockRejectedValue(new Error('Not a member')) };
    const gateway = new RealtimeGateway(guard, access as any);
    const socket: any = { data: {}, join: jest.fn(), handshake: { auth: {} }, disconnect: jest.fn() };
    await gateway.handleConnection(socket);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(await gateway.handleJoinTrip(socket, { tripId: id, userId: id, userName: 'Spoofed' })).toEqual({ status: 'forbidden' });
    socket.data.user = profile;
    expect(await gateway.handleJoinTrip(socket, { tripId: id, userId: id, userName: 'Spoofed' })).toEqual({ status: 'forbidden' });
    expect(socket.join).not.toHaveBeenCalled();
  });
});
