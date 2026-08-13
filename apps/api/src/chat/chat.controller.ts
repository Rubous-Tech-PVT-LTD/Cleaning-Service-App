import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user?: {
    id: string;
    role: string;
  };
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('init')
  async initChat(
    @Body() data: { bookingId: string; clientId: string; providerId: string },
  ) {
    return this.chatService.getOrCreateChat(
      data.bookingId,
      data.clientId,
      data.providerId,
    );
  }

  @Get(':chatId/messages')
  async getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }

  @Get('my-chats')
  async getMyChats(@Request() req: RequestWithUser) {
    const userId = req.user?.id || '';
    return this.chatService.getUserChats(userId);
  }
}
