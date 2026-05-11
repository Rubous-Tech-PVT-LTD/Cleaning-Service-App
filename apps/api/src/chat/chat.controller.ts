import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('init')
  async initChat(@Body() data: { bookingId: string; clientId: string; providerId: string }) {
    return this.chatService.getOrCreateChat(data.bookingId, data.clientId, data.providerId);
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Get('my-chats')
  async getMyChats(@Request() req: any) {
    return this.chatService.getUserChats(req.user.id);
  }
}
