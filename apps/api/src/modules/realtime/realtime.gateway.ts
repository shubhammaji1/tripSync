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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTrip')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; userId: string; userName: string }
  ) {
    const room = `trip:${data.tripId}`;
    client.join(room);
    this.logger.log(`User ${data.userName} (${data.userId}) joined room ${room}`);

    // Broadcast presence update to trip members
    client.to(room).emit('memberJoinedRoom', {
      userId: data.userId,
      userName: data.userName,
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
