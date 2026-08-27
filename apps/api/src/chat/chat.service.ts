import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateChat(bookingId: string, clientId: string, providerId: string) {
    // Validate that the booking exists and get actual participant IDs
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true, providerId: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    let chat = await this.prisma.chat.findFirst({
      where: { bookingId },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          bookingId,
          clientId: booking.clientId, // Always use actual booking client ID
          providerId: booking.providerId || providerId, // Use actual provider ID or provided fallback
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

  async verifyBookingAccess(bookingId: string, userId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { clientId: true, providerId: true },
    });
    if (!booking) return false;
    
    // Handle null providerId (booking not yet assigned)
    const isClient = booking.clientId === userId;
    const isProvider = booking.providerId !== null && booking.providerId === userId;
    const isSystem = userId === 'system';
    
    return isClient || isProvider || isSystem;
  }

  async isParticipant(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { clientId: true, providerId: true },
    });
    if (!chat) return false;
    
    // Handle null providerId
    const isClient = chat.clientId === userId;
    const isProvider = chat.providerId !== null && chat.providerId === userId;
    const isSystem = userId === 'system';
    
    return isClient || isProvider || isSystem;
  }
}
