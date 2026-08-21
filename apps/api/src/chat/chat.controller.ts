import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('init')
  async initChat(@Body() data: { bookingId: string; clientId: string; providerId: string }, @Request() req: any) {
    const isAuthorized = await this.chatService.verifyBookingAccess(data.bookingId, req.user.id);
    if (!isAuthorized) {
      throw new ForbiddenException('You do not have access to this booking');
    }
    return this.chatService.getOrCreateChat(data.bookingId, data.clientId, data.providerId);
  }

  @Get('my-chats')
  async getMyChats(@Request() req: any) {
    return this.chatService.getUserChats(req.user.id);
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId') chatId: string, @Request() req: any) {
    const isParticipant = await this.chatService.isParticipant(chatId, req.user.id);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this chat');
    }
    return this.chatService.getMessages(chatId);
  }
}
