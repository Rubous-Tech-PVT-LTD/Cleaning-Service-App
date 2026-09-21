import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/strategies/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082'],
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}
  handleConnection(client: Socket) {
  }
  handleDisconnect(client: Socket) {
  }
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { role: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }
    client.join(userId);
    if (data.role === 'PROVIDER') {
      client.join('providers');
    } else if (data.role === 'CLIENT') {
      client.join('clients');
    }
  }
  broadcastNewBooking(booking: any) {
    this.server.to('providers').emit('new_booking', booking);
  }
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }
  notifyProviders(providerIds: string[], event: string, data: any) {
    providerIds.forEach(providerId => {
      this.notifyUser(providerId, event, data);
    });
  }
  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @MessageBody() data: { bookingId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    const providerId = client.data?.userId;
    if (!providerId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: { id: true, providerId: true, clientId: true, status: true },
    });
    if (!booking) {
      client.emit('error', { message: 'Booking not found' });
      return;
    }
    if (booking.providerId !== providerId) {
      client.emit('error', { message: 'You are not authorized to update location for this booking' });
      return;
    }
    this.notifyUser(booking.clientId, 'provider_location', {
      latitude: data.latitude,
      longitude: data.longitude,
      providerId: providerId,
      bookingId: data.bookingId,
    });
  }
}
