import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) { }

  // ============================================================
  // PULL CHANGES
  // ============================================================

  async pullChanges(
    lastPulledAt: number | null,
    userId?: string,
    role?: string,
  ) {
    try {
      const syncBoundaryRow = await (this.prisma as any).$queryRaw`
        SELECT NOW() AS sync_boundary
      `;
      const syncBoundaryDate: Date = syncBoundaryRow[0].sync_boundary;
      const syncBoundary = syncBoundaryDate.getTime();
      const lastPulledDate = lastPulledAt
        ? new Date(lastPulledAt)
        : new Date(0);

      const toChangeset = (
        items: any[],
        mapper: (r: any) => any,
      ) => {
        if (!lastPulledAt || lastPulledDate.getTime() === 0) {
          // Initial sync - all records are created
          return {
            created: items.map(mapper),
            updated: [],
            deleted: [],
          };
        }

        // Subsequent syncs - classify based on createdAt vs lastPulledAt
        const created: any[] = [];
        const updated: any[] = [];

        for (const item of items) {
          const createdAt = item.createdAt ? item.createdAt.getTime() : 0;

          if (createdAt > lastPulledAt) {
            // Record was created after last pull
            created.push(mapper(item));
          } else {
            // Record existed before but was updated after last pull
            updated.push(mapper(item));
          }
        }

        return {
          created,
          updated,
          deleted: [],
        };
      };

      // ==========================================================
      // GLOBAL DATA
      // ==========================================================

      // Categories
      const categories = await (this.prisma as any).category.findMany({
        where: {
          updatedAt: {
            gt: lastPulledDate,
            lte: syncBoundaryDate,
          },
        },
        include: {
          _count: {
            select: {
              subcategories: true,
            },
          },
        },
      });

      // Subcategories
      const subcategories = await (
        this.prisma as any
      ).subcategory.findMany({
        where: {
          updatedAt: {
            gt: lastPulledDate,
            lte: syncBoundaryDate,
          },
        },
      });

      // Services
      const services = await (this.prisma as any).service.findMany({
        where: {
          updatedAt: {
            gt: lastPulledDate,
            lte: syncBoundaryDate,
          },
        },
      });

      // ==========================================================
      // USER-SPECIFIC DATA
      // ==========================================================

      let bookings: any[] = [];
      let addresses: any[] = [];
      let chats: any[] = [];
      let messages: any[] = [];

      if (userId) {
        let isProvider = role === 'PROVIDER';

        // Fetch user role if role was not explicitly provided
        if (!isProvider && userId !== '1') {
          const user = await (this.prisma as any).user.findUnique({
            where: {
              id: userId,
            },
          });

          if (user && user.role === 'PROVIDER') {
            isProvider = true;
          }
        }

        // ========================================================
        // PROVIDER DATA
        // ========================================================

        if (isProvider) {
          bookings = await (this.prisma as any).booking.findMany({
            where: {
              OR: [
                {
                  providerId: userId,
                },
                {
                  status: 'PENDING',
                },
              ],
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
            include: {
              address: true,
              service: true,
              client: true,
            },
          });

          const bookingAddressIds = bookings
            .map((booking: any) => booking.addressId)
            .filter(Boolean);

          addresses = await (this.prisma as any).address.findMany({
            where: {
              OR: [
                {
                  userId,
                },
                {
                  id: {
                    in: bookingAddressIds,
                  },
                },
              ],
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
          });

          chats = await (this.prisma as any).chat.findMany({
            where: {
              OR: [
                { providerId: userId },
                { booking: { providerId: userId } },
              ],
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
          });

          messages = await (this.prisma as any).message.findMany({
            where: {
              chat: {
                OR: [
                  { providerId: userId },
                  { booking: { providerId: userId } },
                ],
              },
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
            include: {
              chat: true,
            },
          });
        }

        // ========================================================
        // CLIENT DATA
        // ========================================================

        else {
          bookings = await (this.prisma as any).booking.findMany({
            where: {
              clientId: userId,
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
            include: {
              address: true,
              service: true,
            },
          });

          addresses = await (this.prisma as any).address.findMany({
            where: {
              userId,
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
          });

          chats = await (this.prisma as any).chat.findMany({
            where: {
              OR: [
                { clientId: userId },
                { booking: { clientId: userId } },
              ],
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
          });

          messages = await (this.prisma as any).message.findMany({
            where: {
              chat: {
                OR: [
                  { clientId: userId },
                  { booking: { clientId: userId } },
                ],
              },
              updatedAt: {
                gt: lastPulledDate,
                lte: syncBoundaryDate,
              },
            },
            include: {
              chat: true,
            },
          });
        }
      }

      // ==========================================================
      // DATA MAPPERS
      // ==========================================================

      // Category mapper
      const mapCategory = (r: any) => ({
        id: r.id,

        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',

        icon_url: r.iconUrl,

        // Category ordering
        order: r.order || 0,

        // Used by mobile navigation
        has_subcategories:
          (r._count?.subcategories > 0) || false,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // Subcategory mapper
      const mapSubcategory = (r: any) => ({
        id: r.id,

        category_id: r.categoryId,

        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',

        slug: r.slug,
        icon_url: r.iconUrl,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // Service mapper
      const mapService = (r: any) => ({
        id: r.id,

        category_id: r.categoryId,

        // Optional subcategory relationship
        subcategory_id: r.subcategoryId,

        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',

        description_en:
          r.descriptionTranslations?.en || '',

        description_hi:
          r.descriptionTranslations?.hi || '',

        base_price: Number(r.basePrice),

        image_url: r.imageUrl,
        status: r.status,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // Booking mapper
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

        // Include address details for navigation
        address: r.address ? {
          id: r.address.id,
          address_line1: r.address.addressLine1,
          address_line2: r.address.addressLine2,
          city: r.address.city,
          state: r.address.state,
          pincode: r.address.pincode,
          latitude: r.address.latitude,
          longitude: r.address.longitude,
          label: r.address.label,
        } : null,

        // Include service details for display
        service: r.service ? {
          id: r.service.id,
          name_en: r.service.nameTranslations?.en || '',
          name_hi: r.service.nameTranslations?.hi || '',
          base_price: Number(r.service.basePrice),
        } : null,

        // Include client details for provider reference
        client: r.client ? {
          id: r.client.id,
          full_name: r.client.fullName,
          phone: r.client.phone,
        } : null,
      });

      // Address mapper
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

        latitude: r.latitude,
        longitude: r.longitude,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // Chat mapper
      const mapChat = (r: any) => ({
        id: r.id,

        booking_id: r.bookingId,

        client_id: r.clientId,
        provider_id: r.providerId,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // Message mapper
      const mapMessage = (r: any) => ({
        id: r.id,

        chat_id: r.chatId,

        sender_id: r.senderId,

        content: r.content,

        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });

      // ==========================================================
      // FINAL CHANGESET
      // ==========================================================

      const changes = {
        categories: toChangeset(
          categories,
          mapCategory,
        ),

        subcategories: toChangeset(
          subcategories,
          mapSubcategory,
        ),

        services: toChangeset(
          services,
          mapService,
        ),

        bookings: toChangeset(
          bookings,
          mapBooking,
        ),

        addresses: toChangeset(
          addresses,
          mapAddress,
        ),

        chats: toChangeset(
          chats,
          mapChat,
        ),

        messages: toChangeset(
          messages,
          mapMessage,
        ),

        reviews: {
          created: [],
          updated: [],
          deleted: [],
        },
      };

      console.log(
        `✅ [Sync] Pull successful for user ${userId || 'guest'
        } — ${categories.length} cats, ${subcategories.length
        } subcats, ${services.length} services, ${bookings.length
        } bookings`,
      );

      return {
        changes,
        timestamp: syncBoundary,
      };
    } catch (error) {
      console.error(
        '❌ [Sync] Pull Changes failed:',
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const errorStack =
        error instanceof Error
          ? error.stack
          : undefined;

      require('fs').writeFileSync(
        'pull-error.log',
        JSON.stringify(
          {
            message: errorMessage,
            stack: errorStack,
          },
          null,
          2,
        ),
      );

      throw error;
    }
  }

  // ============================================================
  // PUSH CHANGES
  // ============================================================

  async pushChanges(
    changes: any,
    lastPulledAt: number,
  ) {
    try {
      require('fs').writeFileSync(
        'sync-payload.log',
        JSON.stringify(changes, null, 2),
      );

      // ==========================================================
      // ADDRESSES
      // ==========================================================

      if (changes.addresses) {
        for (const addr of changes.addresses.created || []) {
          await (this.prisma as any).address.upsert({
            where: {
              offlineId:
                addr.offlineId || addr.id,
            },

            update: {
              label: addr.label,

              addressLine1:
                addr.address_line1,

              addressLine2:
                addr.address_line2,

              city: addr.city,
              state: addr.state,
              pincode: addr.pincode,

              isDefault:
                addr.is_default,

              latitude: addr.latitude,
              longitude: addr.longitude,

              version: {
                increment: 1,
              },
            },

            create: {
              offlineId:
                addr.offlineId || addr.id,

              userId: addr.user_id,

              label: addr.label,

              addressLine1:
                addr.address_line1,

              addressLine2:
                addr.address_line2,

              city: addr.city,
              state: addr.state,
              pincode: addr.pincode,

              isDefault:
                addr.is_default,

              latitude: addr.latitude,
              longitude: addr.longitude,
            },
          });
        }

        for (const addr of changes.addresses.updated || []) {
          const addressId = addr.id || addr.addressId;
          const existingAddress = await (this.prisma as any).address.findFirst({
            where: {
              OR: [
                { id: addressId },
                { offlineId: addressId },
              ],
            },
          });

          if (existingAddress) {
            await (this.prisma as any).address.update({
              where: { id: existingAddress.id },
              data: {
                label: addr.label,
                addressLine1: addr.address_line1,
                addressLine2: addr.address_line2,
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
                isDefault: addr.is_default,
                latitude: addr.latitude,
                longitude: addr.longitude,
                version: { increment: 1 },
              },
            });
          }
        }
      }

      // ==========================================================
      // BOOKINGS
      // ==========================================================

      if (changes.bookings) {
        // --------------------------------------------------------
        // New bookings created offline
        // --------------------------------------------------------

        for (const booking of changes.bookings.created || []) {
          const generatedOtp = Math.floor(
            1000 + Math.random() * 9000,
          ).toString();

          const bookingOfflineId =
            booking.offlineId || booking.id;

          const clientId =
            booking.client_id ||
            booking.clientId;

          const serviceId =
            booking.service_id ||
            booking.serviceId;

          const addressId =
            booking.address_id ||
            booking.addressId;

          const bookingAddress =
            addressId
              ? await (this.prisma as any).address.findFirst({
                where: {
                  OR: [
                    {
                      id: addressId,
                    },
                    {
                      offlineId: addressId,
                    },
                  ],
                },
              })
              : null;

          const newBooking =
            await (this.prisma as any).booking.upsert({
              where: {
                offlineId: bookingOfflineId,
              },

              update: {
                status: booking.status,

                version: {
                  increment: 1,
                },
              },

              create: {
                offlineId:
                  bookingOfflineId,

                client: {
                  connect: {
                    id: clientId,
                  },
                },

                ...(serviceId
                  ? {
                    service: {
                      connect: {
                        id: serviceId,
                      },
                    },
                  }
                  : {}),

                ...(bookingAddress?.id
                  ? {
                    address: {
                      connect: {
                        id: bookingAddress.id,
                      },
                    },
                  }
                  : {}),

                scheduledAt: new Date(
                  booking.scheduled_at ||
                  booking.scheduledAt,
                ),

                totalPrice:
                  booking.total_price ||
                  booking.totalPrice,

                items: booking.items
                  ? JSON.parse(booking.items)
                  : [],

                status: booking.status,

                otp: generatedOtp,
              },
            });

          // Broadcast pending booking to providers
          if (
            newBooking.status ===
            'PENDING'
          ) {
            this.trackingGateway.broadcastNewBooking(
              newBooking,
            );
          }
        }

        // --------------------------------------------------------
        // Offline booking updates
        // --------------------------------------------------------

        const STATUS_PRIORITY: Record<
          string,
          number
        > = {
          PENDING: 1,
          ACCEPTED: 2,
          IN_PROGRESS: 3,
          COMPLETED: 4,
          CANCELLED: 5,
        };

        for (const booking of changes.bookings
          .updated || []) {
          const bookingId =
            booking.id ||
            booking.bookingId;

          const serverBooking =
            await (this.prisma as any).booking.findFirst({
              where: {
                OR: [
                  {
                    id: bookingId,
                  },
                  {
                    offlineId: bookingId,
                  },
                ],
              },
            });

          if (!serverBooking) {
            continue;
          }

          const localStatus =
            booking.status as string;

          const serverStatus =
            serverBooking.status as string;

          const localPriority =
            STATUS_PRIORITY[
            localStatus
            ] ?? 0;

          const serverPriority =
            STATUS_PRIORITY[
            serverStatus
            ] ?? 0;

          // Default: server wins
          let resolvedStatus =
            serverStatus;

          let resolvedScheduledAt =
            serverBooking.scheduledAt;

          // Explicit offline cancellation wins
          if (
            localStatus === 'CANCELLED'
          ) {
            resolvedStatus =
              'CANCELLED';

            console.log(
              `[Sync/Conflict] Booking ${serverBooking.id}: local CANCELLED wins over server ${serverStatus}`,
            );
          }

          // Local more advanced state wins
          else if (
            localPriority >
            serverPriority
          ) {
            resolvedStatus =
              localStatus;
          }

          // Reschedule
          const localScheduledAt =
            booking.scheduled_at ||
            booking.scheduledAt;

          if (
            localScheduledAt &&
            localScheduledAt !==
            serverBooking.scheduledAt.getTime()
          ) {
            resolvedScheduledAt =
              new Date(localScheduledAt);
          }

          await (
            this.prisma as any
          ).booking.update({
            where: {
              id: serverBooking.id,
            },

            data: {
              status:
                resolvedStatus,

              scheduledAt:
                resolvedScheduledAt,

              version: {
                increment: 1,
              },
            },
          });
        }
      }

      // ==========================================================
      // REVIEWS
      // ==========================================================

      if (changes.reviews) {
        for (const review of changes.reviews
          .created || []) {
          const reviewBookingId =
            review.booking_id ||
            review.bookingId;

          const booking =
            await (
              this.prisma as any
            ).booking.findFirst({
              where: {
                OR: [
                  {
                    id: reviewBookingId,
                  },
                  {
                    offlineId:
                      reviewBookingId,
                  },
                ],
              },
            });

          if (booking) {
            await (
              this.prisma as any
            ).review.upsert({
              where: {
                bookingId:
                  booking.id,
              },

              update: {
                rating: review.rating,
                comment:
                  review.comment,
              },

              create: {
                bookingId:
                  booking.id,

                rating:
                  review.rating,

                comment:
                  review.comment,
              },
            });
          }
        }
      }

      // ==========================================================
      // CHATS
      // ==========================================================

      if (changes.chats) {
        const allChats = [
          ...(changes.chats.created || []),
          ...(changes.chats.updated || []),
        ];
        for (const chat of allChats) {
          const chatBookingId =
            chat.booking_id ||
            chat.bookingId;

          const booking =
            await (
              this.prisma as any
            ).booking.findFirst({
              where: {
                OR: [
                  {
                    id: chatBookingId,
                  },
                  {
                    offlineId:
                      chatBookingId,
                  },
                ],
              },
            });

          if (booking) {
            const authoritativeProviderId =
              booking.providerId ||
              (chat.provider_id && chat.provider_id !== 'system' ? chat.provider_id : null) ||
              (chat.providerId && chat.providerId !== 'system' ? chat.providerId : null) ||
              'system';

            const existingChat = await (this.prisma as any).chat.findFirst({
              where: {
                OR: [
                  { bookingId: booking.id },
                  { offlineId: chat.offlineId || chat.id },
                ],
              },
            });

            if (existingChat) {
              await (this.prisma as any).chat.update({
                where: { id: existingChat.id },
                data: {
                  ...(booking.providerId ? { providerId: booking.providerId } : {}),
                  version: { increment: 1 },
                },
              });
            } else {
              await (this.prisma as any).chat.create({
                data: {
                  offlineId: chat.offlineId || chat.id,
                  bookingId: booking.id,
                  clientId: chat.client_id || chat.clientId,
                  providerId: authoritativeProviderId,
                },
              });
            }
          }
        }
      }

      // ==========================================================
      // MESSAGES
      // ==========================================================

      if (changes.messages) {
        const allMessages = [
          ...(changes.messages.created || []),
          ...(changes.messages.updated || []),
        ];
        for (const msg of allMessages) {
          const msgChatId =
            msg.chat_id ||
            msg.chatId;

          const chat =
            await (
              this.prisma as any
            ).chat.findFirst({
              where: {
                OR: [
                  {
                    id: msgChatId,
                  },
                  {
                    offlineId:
                      msgChatId,
                  },
                ],
              },
            });

          if (chat) {
            await (
              this.prisma as any
            ).message.upsert({
              where: {
                offlineId:
                  msg.offlineId ||
                  msg.id,
              },

              update: {
                content: msg.content,
                version: {
                  increment: 1,
                },
              },

              create: {
                offlineId:
                  msg.offlineId ||
                  msg.id,

                chatId:
                  chat.id,

                senderId:
                  msg.sender_id ||
                  msg.senderId,

                content:
                  msg.content,

                createdAt: new Date(
                  Math.min(
                    msg.created_at || msg.createdAt,
                    Date.now()
                  )
                ),
              },
            });
          }
        }
      }

      // ==========================================================
      // SUCCESS
      // ==========================================================

      return {
        status: 'ok',
      };
    } catch (error) {
      console.error(
        '❌ [Sync] Push Changes failed:',
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      const errorStack =
        error instanceof Error
          ? error.stack
          : undefined;

      require('fs').writeFileSync(
        'sync-error.log',
        JSON.stringify(
          {
            message: errorMessage,
            stack: errorStack,
          },
          null,
          2,
        ),
      );

      throw error;
    }
  }
}
