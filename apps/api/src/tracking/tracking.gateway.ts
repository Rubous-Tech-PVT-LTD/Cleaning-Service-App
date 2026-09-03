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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Tracking Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Tracking Client disconnected: ${client.id}`);
    // Socket.IO automatically removes the socket from all rooms on disconnect,
    // so no manual cleanup is necessary.
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: string; role: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Join a personal room for the user to support multiple simultaneous connections
    client.join(data.userId);
    
    // Join a room based on role (useful for broadcasting to all providers)
    if (data.role === 'PROVIDER') {
      client.join('providers');
    } else if (data.role === 'CLIENT') {
      client.join('clients');
    }
    
    console.log(`User ${data.userId} registered as ${data.role}`);
  }

  // Method to broadcast new booking to all providers
  broadcastNewBooking(booking: any) {
    this.server.to('providers').emit('new_booking', booking);
  }

  // Method to emit specific updates to a specific user
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }

  // Method to notify specific providers about available bookings
  notifyProviders(providerIds: string[], event: string, data: any) {
    providerIds.forEach(providerId => {
      this.notifyUser(providerId, event, data);
    });
  }

  // Location Tracking
  @SubscribeMessage('update_location')
  handleLocationUpdate(
    @MessageBody() data: { providerId: string; clientId: string; latitude: number; longitude: number },
  ) {
    // Notify the specific client about the provider's new location
    this.notifyUser(data.clientId, 'provider_location', {
      latitude: data.latitude,
      longitude: data.longitude,
      providerId: data.providerId,
    });
  }
}
