import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateChat(bookingId: string, clientId: string, providerId: string) {
    let chat = await this.prisma.chat.findFirst({
      where: { bookingId },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          bookingId,
          clientId,
          providerId,
        },
      });
    }

    return chat;
  }

  async saveMessage(chatId: string, senderId: string, content: string) {
    return this.prisma.message.create({
      data: {
        chatId,
        senderId,
        content,
      },
    });
  }

  async getMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ clientId: userId }, { providerId: userId }],
      },
      include: {
        booking: {
          include: { service: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
