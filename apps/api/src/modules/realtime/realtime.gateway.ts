import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthGuard } from '../../common/auth.guard';
import { TripAccessService } from '../../common/trip-access.service';
import { z } from 'zod';

@WebSocketGateway({
  cors: {
    origin: (process.env.WEB_URL || 'http://localhost:3000').split(',').map((origin) => origin.trim()),
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly auth: AuthGuard, private readonly access: TripAccessService) {}
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  async handleConnection(client: Socket) {
    try {
      const request: any = { headers: { authorization: `Bearer ${client.handshake.auth?.token || ''}` } };
      await this.auth.authenticateRequest(request);
      client.data.user = request.user;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTrip')
  async handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; userId: string; userName: string }
  ) {
    const parsed = z.object({ tripId: z.string().uuid() }).safeParse(data);
    if (!parsed.success || !client.data.user) return { status: 'forbidden' };
    try { await this.access.requireMember(parsed.data.tripId, client.data.user.id); }
    catch { return { status: 'forbidden' }; }
    const room = `trip:${parsed.data.tripId}`;
    await client.join(room);
    this.logger.log(`Authenticated member ${client.data.user.id} joined room ${room}`);

    // Broadcast presence update to trip members
    client.to(room).emit('memberJoinedRoom', {
      userId: client.data.user.id,
      userName: client.data.user.fullName,
      timestamp: new Date().toISOString(),
    });

    return { status: 'joined', room };
  }

  @SubscribeMessage('leaveTrip')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; userId: string }
  ) {
    const room = `trip:${data.tripId}`;
    client.leave(room);
    return { status: 'left', room };
  }

  /**
   * Broadcast an event to all clients currently viewing a trip
   */
  broadcastTripEvent(tripId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`trip:${tripId}`).emit(event, {
        ...payload,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
