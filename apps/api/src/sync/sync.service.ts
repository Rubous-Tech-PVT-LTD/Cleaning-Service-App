import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) {}

  async pullChanges(lastPulledAt: number | null, userId?: string, role?: string) {
    try {
      const lastPulledDate = lastPulledAt ? new Date(lastPulledAt) : new Date(0);

      const toChangeset = (items: any[], mapper: (r: any) => any) => ({
        created: items.map(mapper),
        updated: [],
        deleted: [],
      });

      // Global data
      const categories = await (this.prisma as any).category.findMany({
        where: { updatedAt: { gt: lastPulledDate } },
      });
      const services = await (this.prisma as any).service.findMany({
        where: { updatedAt: { gt: lastPulledDate } },
      });

      let bookings = [];
      let addresses = [];
      let chats = [];
      let messages = [];

      if (userId) {
        let isProvider = role === 'PROVIDER';
        
        // Fetch user to check their role if not explicitly passed as provider
        if (!isProvider && userId !== '1') {
          const user = await (this.prisma as any).user.findUnique({
            where: { id: userId }
          });
          
          if (user && user.role === 'PROVIDER') {
            isProvider = true;
          }
        }

        if (isProvider) {
          bookings = await (this.prisma as any).booking.findMany({
            where: { 
              OR: [
                { providerId: userId },
                { status: 'PENDING' }
              ],
              updatedAt: { gt: lastPulledDate } 
            },
          });
          
          const bookingAddressIds = bookings.map((b: any) => b.addressId).filter(Boolean);
          addresses = await (this.prisma as any).address.findMany({
            where: { 
              OR: [
                { userId },
                { id: { in: bookingAddressIds } }
              ],
              updatedAt: { gt: lastPulledDate } 
            },
          });
          
          chats = await (this.prisma as any).chat.findMany({
            where: { providerId: userId, updatedAt: { gt: lastPulledDate } },
          });
          
          messages = await (this.prisma as any).message.findMany({
            where: { chat: { providerId: userId }, updatedAt: { gt: lastPulledDate } },
          });
        } else {
          bookings = await (this.prisma as any).booking.findMany({
            where: { clientId: userId, updatedAt: { gt: lastPulledDate } },
          });
          
          addresses = await (this.prisma as any).address.findMany({
            where: { userId, updatedAt: { gt: lastPulledDate } },
          });
          
          chats = await (this.prisma as any).chat.findMany({
            where: { clientId: userId, updatedAt: { gt: lastPulledDate } },
          });
          
          // This is simplified; ideally fetch messages for those chats
          messages = await (this.prisma as any).message.findMany({
            where: { chat: { clientId: userId }, updatedAt: { gt: lastPulledDate } },
          });
        }
      }

      const mapCategory = (r: any) => ({
        id: r.id,
        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',
        icon_url: r.iconUrl,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapService = (r: any) => ({
        id: r.id,
        category_id: r.categoryId,
        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',
        base_price: Number(r.basePrice),
        image_url: r.imageUrl,
        status: r.status,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapBooking = (r: any) => ({
        id: r.id,
        service_id: r.serviceId,
        client_id: r.clientId,
        provider_id: r.providerId,
        address_id: r.addressId,
        status: r.status,
        scheduled_at: r.scheduledAt.getTime(),
        total_price: Number(r.totalPrice),
        items: JSON.stringify(r.items),
        otp: r.otp,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapAddress = (r: any) => ({
        id: r.id,
        user_id: r.userId,
        label: r.label,
        address_line1: r.addressLine1,
        address_line2: r.addressLine2,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        is_default: r.isDefault,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapChat = (r: any) => ({
        id: r.id,
        booking_id: r.bookingId,
        client_id: r.clientId,
        provider_id: r.providerId,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapMessage = (r: any) => ({
        id: r.id,
        chat_id: r.chatId,
        sender_id: r.senderId,
        content: r.content,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const changes = {
        categories: toChangeset(categories, mapCategory),
        services: toChangeset(services, mapService),
        bookings: toChangeset(bookings, mapBooking),
        addresses: toChangeset(addresses, mapAddress),
        chats: toChangeset(chats, mapChat),
        messages: toChangeset(messages, mapMessage),
        reviews: { created: [], updated: [], deleted: [] },
      };

      console.log(`✅ [Sync] Pull successful for user ${userId || 'guest'} — ${categories.length} cats, ${bookings.length} bookings`);
      return { changes, timestamp: Date.now() };
    } catch (error) {
      console.error('❌ [Sync] Pull Changes failed:', error);
      require('fs').writeFileSync('pull-error.log', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
      throw error;
    }
  }

  async pushChanges(changes: any, lastPulledAt: number) {
    try {
    require('fs').writeFileSync('sync-payload.log', JSON.stringify(changes, null, 2));
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
      // ── New bookings created offline ────────────────────────────────────────
      for (const booking of changes.bookings.created || []) {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const newBooking = await (this.prisma as any).booking.upsert({
          where: { offlineId: booking.offlineId || booking.id },
          update: { status: booking.status, version: { increment: 1 } },
          create: {
            offlineId: booking.offlineId || booking.id,
            client: { connect: { id: booking.client_id || booking.clientId } },
            service: { connect: { id: booking.service_id || booking.serviceId } },
            ...(await (async () => {
              const addr = await this.prisma.address.findFirst({
                where: { OR: [{ id: booking.address_id || booking.addressId }, { offlineId: booking.address_id || booking.addressId }] }
              });
              return addr?.id ? { address: { connect: { id: addr.id } } } : {};
            })()),
            scheduledAt: new Date(booking.scheduled_at || booking.scheduledAt),
            totalPrice: booking.total_price || booking.totalPrice,
            items: (booking as any).items ? JSON.parse(booking.items) : [],
            status: booking.status,
            otp: generatedOtp,
          },
        });

        // 🚨 Broadcast to all providers since client created it
        if (newBooking.status === 'PENDING') {
          this.trackingGateway.broadcastNewBooking(newBooking);
        }
      }

      // ── Bookings updated offline (cancel / reschedule) ─────────────────────
      // Status priority: higher = more final. Local CANCELLED always wins.
      const STATUS_PRIORITY: Record<string, number> = {
        PENDING: 1, ACCEPTED: 2, IN_PROGRESS: 3, COMPLETED: 4, CANCELLED: 5,
      };

      for (const booking of changes.bookings.updated || []) {
        // Fetch the current server state first
        const serverBooking = await this.prisma.booking.findFirst({
          where: { OR: [{ id: booking.id }, { offlineId: booking.id }] },
        });

        if (!serverBooking) continue;

        const localStatus  = booking.status as string;
        const serverStatus = serverBooking.status as string;
        const localPriority  = STATUS_PRIORITY[localStatus]  ?? 0;
        const serverPriority = STATUS_PRIORITY[serverStatus] ?? 0;

        let resolvedStatus = serverStatus; // default: server wins
        let resolvedScheduledAt = serverBooking.scheduledAt;

        if (localStatus === 'CANCELLED') {
          // User explicitly cancelled offline → always honour
          resolvedStatus = 'CANCELLED';
          console.log(`[Sync/Conflict] Booking ${serverBooking.id}: local CANCELLED wins over server ${serverStatus}`);
        } else if (localPriority > serverPriority) {
          // Local is more advanced (shouldn't usually happen but handle it)
          resolvedStatus = localStatus;
        }

        // Reschedule: if local scheduledAt differs and local is newer, apply it
        if (booking.scheduled_at && booking.scheduled_at !== serverBooking.scheduledAt.getTime()) {
          resolvedScheduledAt = new Date(booking.scheduled_at);
        }

        await this.prisma.booking.update({
          where: { id: serverBooking.id },
          data: {
            status: resolvedStatus as any,
            scheduledAt: resolvedScheduledAt,
            version: { increment: 1 },
          },
        });
      }
    }

    // Process reviews
    if (changes.reviews) {
      for (const review of changes.reviews.created || []) {
        // Find booking by offlineId or real ID
        const booking = await this.prisma.booking.findFirst({
          where: { OR: [{ id: review.booking_id || review.bookingId }, { offlineId: review.booking_id || review.bookingId }] },
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
        const chatBookingId = chat.booking_id || chat.bookingId;
        const booking = await this.prisma.booking.findFirst({
          where: { OR: [{ id: chatBookingId }, { offlineId: chatBookingId }] },
        });
        
        if (booking) {
          await this.prisma.chat.upsert({
            where: { offlineId: chat.offlineId || chat.id },
            update: { version: { increment: 1 } },
            create: {
              offlineId: chat.offlineId || chat.id,
              bookingId: booking.id,
              clientId: chat.client_id || chat.clientId,
              providerId: chat.provider_id || chat.providerId || 'system',
            },
          });
        }
      }
    }

    // Process messages
    if (changes.messages) {
      for (const msg of changes.messages.created || []) {
        const msgChatId = msg.chat_id || msg.chatId;
        const chat = await this.prisma.chat.findFirst({
          where: { OR: [{ id: msgChatId }, { offlineId: msgChatId }] },
        });
        
        if (chat) {
          await this.prisma.message.upsert({
            where: { offlineId: msg.offlineId || msg.id },
            update: { version: { increment: 1 } },
            create: {
              offlineId: msg.offlineId || msg.id,
              chatId: chat.id,
              senderId: msg.sender_id || msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.created_at || msg.createdAt),
            },
          });
        }
      }
    }

    return { status: 'ok' };
    } catch (error) {
      console.error('Push Error:', error);
      require('fs').writeFileSync('sync-error.log', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
      throw error;
    }
  }
}
