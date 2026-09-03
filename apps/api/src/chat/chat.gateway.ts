import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from '../auth/strategies/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHeader(client);
      if (!token) {
        console.log(`Client connected without token: ${client.id} - chat features will be restricted`);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;
      console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
    } catch (error) {
      console.log(`Client connection token invalid: ${client.id} - ${error.message} - chat features will be restricted`);
      // We don't disconnect because they might be connecting for TrackingGateway
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId?: string; bookingId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    if (data.bookingId) {
      const isAuthorized = await this.chatService.verifyBookingAccess(data.bookingId, userId);
      if (!isAuthorized) {
        console.warn(`[Socket] Unauthorized joinChat attempt by user ${userId} for booking ${data.bookingId}`);
        client.emit('error', { message: 'You are not authorized to access this booking' });
        return;
      }
    } else if (data.chatId) {
      const isParticipant = await this.chatService.isParticipant(data.chatId, userId);
      if (!isParticipant) {
        console.warn(`[Socket] Unauthorized joinChat attempt by user ${userId} for chat ${data.chatId}`);
        client.emit('error', { message: 'You are not a participant in this chat' });
        return;
      }
    } else {
      client.emit('error', { message: 'Either chatId or bookingId must be provided' });
      return; // Neither provided
    }

    if (data.chatId) {
      client.join(`chat:${data.chatId}`);
    }
    if (data.bookingId) {
      client.join(`booking:${data.bookingId}`);
    }
    console.log(`Client ${client.id} joined rooms for chat:${data.chatId || ''} booking:${data.bookingId || ''}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    if (!senderId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    // Validate message content
    if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
      client.emit('error', { message: 'Message content cannot be empty' });
      return;
    }

    if (data.content.trim().length > 5000) {
      client.emit('error', { message: 'Message content too long (max 5000 characters)' });
      return;
    }

    const isParticipant = await this.chatService.isParticipant(data.chatId, senderId);
    if (!isParticipant) {
      console.warn(`[Socket] Unauthorized sendMessage attempt by user ${senderId} for chat ${data.chatId}`);
      client.emit('error', { message: 'You are not authorized to send messages in this chat' });
      return;
    }

    const message = await this.chatService.saveMessage(
      data.chatId,
      senderId,
      data.content.trim(),
    );

    // Broadcast to the chat room
    this.server.to(`chat:${data.chatId}`).emit('newMessage', message);
  }

  @SubscribeMessage('send_sync_ping')
  async handleSyncPing(
    @MessageBody() data: { chatId?: string; bookingId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    if (!senderId) return;

    // Broadcast primarily through booking room to avoid duplicate events
    if (data.bookingId) {
      client.to(`booking:${data.bookingId}`).emit('sync_ping', { senderId, bookingId: data.bookingId });
    } else if (data.chatId) {
      client.to(`chat:${data.chatId}`).emit('sync_ping', { senderId, chatId: data.chatId });
    }
    console.log(`Broadcasted sync_ping for booking:${data.bookingId || ''} chat:${data.chatId || ''}`);
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const tokenFromAuth = client.handshake.auth?.token;
    if (tokenFromAuth) {
      const [type, token] = typeof tokenFromAuth === 'string' ? tokenFromAuth.split(' ') : [];
      if (type === 'Bearer' && token) return token;
      return typeof tokenFromAuth === 'string' ? tokenFromAuth : undefined;
    }

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' ? token : undefined;
    }
    return undefined;
  }
}
