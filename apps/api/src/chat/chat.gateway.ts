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
import { PrismaService } from '../prisma/prisma.service';
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHeader(client);
      if (!token) {
        return;
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;
    } catch (error) {
    }
  }
  handleDisconnect(client: Socket) {
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
        client.emit('error', { message: 'You are not authorized to access this booking' });
        return;
      }
    } else if (data.chatId) {
      const isParticipant = await this.chatService.isParticipant(data.chatId, userId);
      if (!isParticipant) {
        client.emit('error', { message: 'You are not a participant in this chat' });
        return;
      }
    } else {
      client.emit('error', { message: 'Either chatId or bookingId must be provided' });
      return;
    }
    if (data.chatId) {
      client.join(`chat:${data.chatId}`);
    }
    if (data.bookingId) {
      client.join(`booking:${data.bookingId}`);
    }
  }
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; content: string; offlineId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    if (!senderId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }
    if (!data.content || typeof data.content !== 'string' || !data.content.trim()) {
      client.emit('error', { message: 'Message content cannot be empty' });
      return;
    }
    if (data.content.trim().length > 5000) {
      client.emit('error', { message: 'Message content too long (max 5000 characters)' });
      return;
    }
    const chat = await this.prisma.chat.findUnique({
      where: { id: data.chatId },
      select: { id: true, clientId: true, providerId: true, bookingId: true },
    });
    if (!chat) {
      client.emit('error', { message: 'Chat not found' });
      return;
    }
    const isParticipant = await this.chatService.isParticipant(data.chatId, senderId);
    if (!isParticipant) {
      client.emit('error', { message: 'You are not authorized to send messages in this chat' });
      return;
    }
    const message = await this.chatService.saveMessage(
      data.chatId,
      senderId,
      data.content.trim(),
    );
    const messageWithOfflineId = {
      ...message,
      offlineId: data.offlineId,
    };
    this.server.to(`chat:${data.chatId}`).emit('newMessage', messageWithOfflineId);
  }
  @SubscribeMessage('send_sync_ping')
  async handleSyncPing(
    @MessageBody() data: { chatId?: string; bookingId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId;
    if (!senderId) return;
    if (data.bookingId) {
      client.to(`booking:${data.bookingId}`).emit('sync_ping', { senderId, bookingId: data.bookingId });
    } else if (data.chatId) {
      client.to(`chat:${data.chatId}`).emit('sync_ping', { senderId, chatId: data.chatId });
    }
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
