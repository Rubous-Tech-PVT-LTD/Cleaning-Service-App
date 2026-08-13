import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import * as fs from 'fs';
import {
  Category,
  Service,
  Booking,
  Address,
  Chat,
  Message,
  Prisma,
  BookingStatus,
} from '@prisma/client';

interface AddressSyncInput {
  id: string;
  offlineId?: string | null;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface BookingSyncInput {
  id: string;
  offlineId?: string | null;
  client_id?: string | null;
  clientId?: string | null;
  service_id?: string | null;
  serviceId?: string | null;
  address_id?: string | null;
  addressId?: string | null;
  scheduled_at?: number | string | null;
  scheduledAt?: string | Date | null;
  total_price?: number | null;
  totalPrice?: number | null;
  items?: string | null;
  status: string;
  otp?: string | null;
}

interface ReviewSyncInput {
  booking_id?: string | null;
  bookingId?: string | null;
  rating: number;
  comment?: string | null;
}

interface ChatSyncInput {
  id: string;
  offlineId?: string | null;
  booking_id?: string | null;
  bookingId?: string | null;
  client_id?: string | null;
  clientId?: string | null;
  provider_id?: string | null;
  providerId?: string | null;
}

interface MessageSyncInput {
  id: string;
  offlineId?: string | null;
  chat_id?: string | null;
  chatId?: string | null;
  sender_id?: string | null;
  senderId?: string | null;
  content: string;
  created_at?: number | string | null;
  createdAt?: string | Date | null;
}

export interface SyncChanges {
  addresses?: {
    created?: AddressSyncInput[];
    updated?: AddressSyncInput[];
  };
  bookings?: {
    created?: BookingSyncInput[];
    updated?: BookingSyncInput[];
  };
  reviews?: {
    created?: ReviewSyncInput[];
  };
  chats?: {
    created?: ChatSyncInput[];
  };
  messages?: {
    created?: MessageSyncInput[];
  };
}

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) {}

  async pullChanges(
    lastPulledAt: number | null,
    userId?: string,
    role?: string,
  ) {
    try {
      const lastPulledDate = lastPulledAt
        ? new Date(lastPulledAt)
        : new Date(0);

      const toChangeset = <T, U>(items: T[], mapper: (r: T) => U) => ({
        created: items.map(mapper),
        updated: [],
        deleted: [],
      });

      // Global data
      const categories = await this.prisma.category.findMany({
        where: { updatedAt: { gt: lastPulledDate } },
      });
      const services = await this.prisma.service.findMany({
        where: { updatedAt: { gt: lastPulledDate } },
      });

      let bookings: Booking[] = [];
      let addresses: Address[] = [];
      let chats: Chat[] = [];
      let messages: Message[] = [];

      if (userId) {
        let isProvider = role === 'PROVIDER';

        // Fetch user to check their role if not explicitly passed as provider
        if (!isProvider && userId !== '1') {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });

          if (user && user.role === 'PROVIDER') {
            isProvider = true;
          }
        }

        if (isProvider) {
          bookings = await this.prisma.booking.findMany({
            where: {
              OR: [{ providerId: userId }, { status: 'PENDING' }],
              updatedAt: { gt: lastPulledDate },
            },
          });

          const bookingAddressIds = bookings
            .map((b) => b.addressId)
            .filter((id): id is string => !!id);
          addresses = await this.prisma.address.findMany({
            where: {
              OR: [{ userId }, { id: { in: bookingAddressIds } }],
              updatedAt: { gt: lastPulledDate },
            },
          });

          chats = await this.prisma.chat.findMany({
            where: { providerId: userId, updatedAt: { gt: lastPulledDate } },
          });

          messages = await this.prisma.message.findMany({
            where: {
              chat: { providerId: userId },
              updatedAt: { gt: lastPulledDate },
            },
          });
        } else {
          bookings = await this.prisma.booking.findMany({
            where: { clientId: userId, updatedAt: { gt: lastPulledDate } },
          });

          addresses = await this.prisma.address.findMany({
            where: { userId, updatedAt: { gt: lastPulledDate } },
          });

          chats = await this.prisma.chat.findMany({
            where: { clientId: userId, updatedAt: { gt: lastPulledDate } },
          });

          // Fetch messages for those chats
          messages = await this.prisma.message.findMany({
            where: {
              chat: { clientId: userId },
              updatedAt: { gt: lastPulledDate },
            },
          });
        }
      }

      const mapCategory = (r: Category) => {
        const nameTrans = r.nameTranslations as Record<string, string>;
        return {
          id: r.id,
          name_en: nameTrans?.en || '',
          name_hi: nameTrans?.hi || '',
          icon_url: r.iconUrl,
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        };
      };

      const mapService = (r: Service) => {
        const nameTrans = r.nameTranslations as Record<string, string>;
        return {
          id: r.id,
          category_id: r.categoryId,
          name_en: nameTrans?.en || '',
          name_hi: nameTrans?.hi || '',
          base_price: Number(r.basePrice),
          image_url: r.imageUrl,
          status: r.status,
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        };
      };

      const mapBooking = (r: Booking) => ({
        id: r.id,
        service_id: r.serviceId,
        client_id: r.clientId,
        provider_id: r.providerId,
        address_id: r.addressId,
        status: r.status,
        scheduled_at: r.scheduledAt.getTime(),
        total_price: Number(r.totalPrice),
        items: r.items ? JSON.stringify(r.items) : null,
        otp: r.otp,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapAddress = (r: Address) => ({
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

      const mapChat = (r: Chat) => ({
        id: r.id,
        booking_id: r.bookingId,
        client_id: r.clientId,
        provider_id: r.providerId,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      const mapMessage = (r: Message) => ({
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

      console.log(
        `✅ [Sync] Pull successful for user ${userId || 'guest'} — ${categories.length} cats, ${bookings.length} bookings`,
      );
      return { changes, timestamp: Date.now() };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ [Sync] Pull Changes failed:', err);
      fs.writeFileSync(
        'pull-error.log',
        JSON.stringify({ message: err.message, stack: err.stack }, null, 2),
      );
      throw error;
    }
  }

  async pushChanges(changes: SyncChanges) {
    try {
      fs.writeFileSync('sync-payload.log', JSON.stringify(changes, null, 2));
      // Process addresses
      if (changes.addresses) {
        for (const addr of changes.addresses.created || []) {
          await this.prisma.address.upsert({
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
          const generatedOtp = Math.floor(
            1000 + Math.random() * 9000,
          ).toString();
          const newBooking = await this.prisma.booking.upsert({
            where: { offlineId: booking.offlineId || booking.id },
            update: {
              status: booking.status as BookingStatus,
              version: { increment: 1 },
            },
            create: {
              offlineId: booking.offlineId || booking.id,
              client: {
                connect: {
                  id: booking.client_id || booking.clientId || undefined,
                },
              },
              service: {
                connect: {
                  id: booking.service_id || booking.serviceId || undefined,
                },
              },
              ...(await (async () => {
                const addr = await this.prisma.address.findFirst({
                  where: {
                    OR: [
                      {
                        id:
                          booking.address_id || booking.addressId || undefined,
                      },
                      {
                        offlineId:
                          booking.address_id || booking.addressId || undefined,
                      },
                    ],
                  },
                });
                return addr?.id
                  ? { address: { connect: { id: addr.id } } }
                  : {};
              })()),
              scheduledAt: new Date(
                booking.scheduled_at || booking.scheduledAt || Date.now(),
              ),
              totalPrice: new Prisma.Decimal(
                booking.total_price || booking.totalPrice || 0,
              ),
              items: booking.items
                ? (JSON.parse(booking.items) as Prisma.InputJsonValue)
                : Prisma.DbNull,
              status:
                (booking.status as BookingStatus) || BookingStatus.PENDING,
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
          PENDING: 1,
          ACCEPTED: 2,
          IN_PROGRESS: 3,
          COMPLETED: 4,
          CANCELLED: 5,
        };

        for (const booking of changes.bookings.updated || []) {
          // Fetch the current server state first
          const serverBooking = await this.prisma.booking.findFirst({
            where: { OR: [{ id: booking.id }, { offlineId: booking.id }] },
          });

          if (!serverBooking) continue;

          const localStatus = booking.status;
          const serverStatus = serverBooking.status as string;
          const localPriority = STATUS_PRIORITY[localStatus] ?? 0;
          const serverPriority = STATUS_PRIORITY[serverStatus] ?? 0;

          let resolvedStatus = serverStatus; // default: server wins
          let resolvedScheduledAt = serverBooking.scheduledAt;

          if (localStatus === 'CANCELLED') {
            // User explicitly cancelled offline → always honour
            resolvedStatus = 'CANCELLED';
            console.log(
              `[Sync/Conflict] Booking ${serverBooking.id}: local CANCELLED wins over server ${serverStatus}`,
            );
          } else if (localPriority > serverPriority) {
            // Local is more advanced (shouldn't usually happen but handle it)
            resolvedStatus = localStatus;
          }

          // Reschedule: if local scheduledAt differs and local is newer, apply it
          if (
            booking.scheduled_at &&
            Number(booking.scheduled_at) !== serverBooking.scheduledAt.getTime()
          ) {
            resolvedScheduledAt = new Date(booking.scheduled_at);
          }

          await this.prisma.booking.update({
            where: { id: serverBooking.id },
            data: {
              status: resolvedStatus as BookingStatus,
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
            where: {
              OR: [
                { id: review.booking_id || review.bookingId || undefined },
                {
                  offlineId: review.booking_id || review.bookingId || undefined,
                },
              ],
            },
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
            where: {
              OR: [
                { id: chatBookingId || undefined },
                { offlineId: chatBookingId || undefined },
              ],
            },
          });

          if (booking) {
            await this.prisma.chat.upsert({
              where: { offlineId: chat.offlineId || chat.id },
              update: { version: { increment: 1 } },
              create: {
                offlineId: chat.offlineId || chat.id,
                bookingId: booking.id,
                clientId: chat.client_id || chat.clientId || '',
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
            where: {
              OR: [
                { id: msgChatId || undefined },
                { offlineId: msgChatId || undefined },
              ],
            },
          });

          if (chat) {
            await this.prisma.message.upsert({
              where: { offlineId: msg.offlineId || msg.id },
              update: { version: { increment: 1 } },
              create: {
                offlineId: msg.offlineId || msg.id,
                chatId: chat.id,
                senderId: msg.sender_id || msg.senderId || '',
                content: msg.content,
                createdAt: new Date(
                  msg.created_at || msg.createdAt || Date.now(),
                ),
              },
            });
          }
        }
      }

      return { status: 'ok' };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Push Error:', err);
      fs.writeFileSync(
        'sync-error.log',
        JSON.stringify({ message: err.message, stack: err.stack }, null, 2),
      );
      throw error;
    }
  }
}
