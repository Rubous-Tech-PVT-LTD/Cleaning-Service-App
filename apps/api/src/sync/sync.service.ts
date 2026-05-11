import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pullChanges(lastPulledAt: number | null) {
    try {
      const lastPulledDate = lastPulledAt ? new Date(lastPulledAt) : new Date(0);

      const parseJson = (val: any) => {
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch (e) { return {}; }
        }
        return val || {};
      };

      // Fetch only records updated since lastPulledAt
      const categories = await (this.prisma as any).category.findMany({
        where: lastPulledAt ? { updatedAt: { gt: lastPulledDate } } : {},
      });
      const services = await (this.prisma as any).service.findMany({
        where: lastPulledAt ? { updatedAt: { gt: lastPulledDate } } : {},
      });

      const mapCategory = (r: any) => {
        const names = parseJson(r.nameTranslations);
        return {
          id: r.id,
          name_en: names.en || '',
          name_hi: names.hi || '',
          icon_url: r.iconUrl || '',
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        };
      };

      const mapService = (r: any) => {
        const names = parseJson(r.nameTranslations);
        return {
          id: r.id,
          category_id: r.categoryId,
          name_en: names.en || '',
          name_hi: names.hi || '',
          base_price: Number(r.basePrice),
          image_url: r.imageUrl || '',
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        };
      };

      const toChangeset = (records: any[], mapper: (r: any) => any) => ({
        created: records.filter(r => r.createdAt > lastPulledDate).map(mapper),
        updated: records.filter(r => r.createdAt <= lastPulledDate).map(mapper),
        deleted: [],
      });

      const changes = {
        categories: toChangeset(categories, mapCategory),
        services: toChangeset(services, mapService),
        // User-specific: returned empty here, fetched via dedicated endpoints after login
        bookings: { created: [], updated: [], deleted: [] },
        chats: { created: [], updated: [], deleted: [] },
        messages: { created: [], updated: [], deleted: [] },
        reviews: { created: [], updated: [], deleted: [] },
        addresses: { created: [], updated: [], deleted: [] },
      };

      console.log(`✅ [Sync] Pull successful — ${categories.length} categories, ${services.length} services`);
      return { changes, timestamp: Date.now() };
    } catch (error) {
      console.error('❌ [Sync] Pull Changes failed:', error);
      throw error;
    }
  }

  async pushChanges(changes: any, lastPulledAt: number) {
    // Process addresses
    if (changes.addresses) {
      for (const addr of changes.addresses.created || []) {
        await (this.prisma as any).address.upsert({
          where: { offlineId: addr.offlineId || addr.id },
          update: {
            label: addr.label,
            addressLine1: addr.address_line1,
            addressLine2: addr.address_line2,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.is_default,
            version: { increment: 1 },
          },
          create: {
            offlineId: addr.offlineId || addr.id,
            userId: addr.user_id,
            label: addr.label,
            addressLine1: addr.address_line1,
            addressLine2: addr.address_line2,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            isDefault: addr.is_default,
          },
        });
      }
    }

    // Process bookings
    if (changes.bookings) {
      for (const booking of changes.bookings.created || []) {
        await (this.prisma as any).booking.upsert({
          where: { offlineId: booking.offlineId || booking.id },
          update: { status: booking.status, version: { increment: 1 } },
          create: {
            offlineId: booking.offlineId || booking.id,
            clientId: booking.clientId,
            serviceId: booking.serviceId,
            scheduledAt: new Date(booking.scheduledAt),
            totalPrice: booking.total_price || booking.totalPrice,
            items: (booking as any).items ? JSON.parse(booking.items) : [],
            status: booking.status,
          },
        });
      }
    }

    // Process reviews
    if (changes.reviews) {
      for (const review of changes.reviews.created || []) {
        // Find booking by offlineId or real ID
        const booking = await this.prisma.booking.findFirst({
          where: { OR: [{ id: review.bookingId }, { offlineId: review.bookingId }] },
        });

        if (booking) {
          await this.prisma.review.upsert({
            where: { bookingId: booking.id },
            update: { rating: review.rating, comment: review.comment },
            create: {
              bookingId: booking.id,
              rating: review.rating,
              comment: review.comment,
            },
          });
        }
      }
    }

    // Process chats
    if (changes.chats) {
      for (const chat of changes.chats.created || []) {
        await this.prisma.chat.upsert({
          where: { offlineId: chat.offlineId || chat.id },
          update: { version: { increment: 1 } },
          create: {
            offlineId: chat.offlineId || chat.id,
            bookingId: chat.bookingId,
            clientId: chat.clientId,
            providerId: chat.providerId || 'system',
          },
        });
      }
    }

    // Process messages
    if (changes.messages) {
      for (const msg of changes.messages.created || []) {
        // Find the chat by its offlineId or real ID
        const chat = await this.prisma.chat.findFirst({
          where: { OR: [{ id: msg.chatId }, { offlineId: msg.chatId }] },
        });

        if (chat) {
          await this.prisma.message.upsert({
            where: { offlineId: msg.offlineId || msg.id },
            update: { version: { increment: 1 } },
            create: {
              offlineId: msg.offlineId || msg.id,
              chatId: chat.id,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt),
            },
          });
        }
      }
    }

    return { status: 'ok' };
  }
}
