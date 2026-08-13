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
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(data.chatId);
    console.log(`Client ${client.id} joined chat ${data.chatId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { chatId: string; senderId: string; content: string },
  ) {
    const message = await this.chatService.saveMessage(
      data.chatId,
      data.senderId,
      data.content,
    );

    // Broadcast to the chat room
    this.server.to(data.chatId).emit('newMessage', message);
  }

  @SubscribeMessage('send_sync_ping')
  handleSyncPing(
    @MessageBody() data: { chatId: string; senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast a sync ping to the chat room so the other person's app syncs
    client.to(data.chatId).emit('sync_ping', { senderId: data.senderId });
    console.log(`Broadcasted sync_ping for chat ${data.chatId}`);
  }
}
