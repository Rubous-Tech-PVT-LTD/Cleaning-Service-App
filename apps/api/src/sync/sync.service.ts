import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
const calculateDistance = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number => {
  const earthRadiusKm = 6371;
  const latitudeDelta = (latitude2 - latitude1) * (Math.PI / 180);
  const longitudeDelta = (longitude2 - longitude1) * (Math.PI / 180);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1 * (Math.PI / 180)) *
    Math.cos(latitude2 * (Math.PI / 180)) *
    Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
  ) { }
  private async findProviderForBooking(serviceId: string, address: any) {
    if (!serviceId || address?.latitude == null || address?.longitude == null) {
      return null;
    }
    const providers = await (this.prisma as any).user.findMany({
      where: {
        role: 'PROVIDER',
        profile: {
          isVerified: true,
          latitude: { not: null },
          longitude: { not: null },
          OR: [
            { professionIds: { array_contains: serviceId } },
            { professionId: serviceId },
          ],
        },
      },
      include: { profile: true },
    });
    return providers
      .map((provider: any) => ({
        provider,
        distance: calculateDistance(
          address.latitude,
          address.longitude,
          provider.profile.latitude,
          provider.profile.longitude,
        ),
      }))
      .filter((candidate: any) => candidate.distance <= 25)
      .sort((left: any, right: any) => left.distance - right.distance)[0]
      ?.provider || null;
  }
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
          return {
            created: items.map(mapper),
            updated: [],
            deleted: [],
          };
        }
        const created: any[] = [];
        const updated: any[] = [];
        for (const item of items) {
          const createdAt = item.createdAt ? item.createdAt.getTime() : 0;
          if (createdAt > lastPulledAt) {
            created.push(mapper(item));
          } else {
            updated.push(mapper(item));
          }
        }
        return {
          created,
          updated,
          deleted: [],
        };
      };
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
      const services = await (this.prisma as any).service.findMany({
        where: {
          updatedAt: {
            gt: lastPulledDate,
            lte: syncBoundaryDate,
          },
        },
        include: {
          subcategory: {
            select: {
              nameTranslations: true
            }
          }
        }
      });
      let bookings: any[] = [];
      let addresses: any[] = [];
      let chats: any[] = [];
      let messages: any[] = [];
      if (userId) {
        let isProvider = role === 'PROVIDER';
        const isInitialSync = !lastPulledAt || lastPulledAt === 0;
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
        if (isProvider) {
          const providerUser = await (this.prisma as any).user.findUnique({
            where: { id: userId },
            include: { profile: true }
          });
          const professionIds: string[] = [];
          if (providerUser?.profile?.professionId) {
            professionIds.push(providerUser.profile.professionId);
          }
          if (providerUser?.profile?.professionIds && Array.isArray(providerUser.profile.professionIds)) {
            professionIds.push(...(providerUser.profile.professionIds as string[]));
          }
          const providerBookingWhere = isInitialSync ? {
            OR: [
              { providerId: userId },
              { status: 'PENDING', serviceId: { in: professionIds } }
            ]
          } : {
            OR: [
              { providerId: userId },
              { status: 'PENDING', serviceId: { in: professionIds } }
            ],
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          bookings = await (this.prisma as any).booking.findMany({
            where: providerBookingWhere,
            include: {
              address: true,
              service: true,
              client: true,
            },
          });
          const bookingAddressIds = bookings
            .map((booking: any) => booking.addressId)
            .filter(Boolean);
          const providerAddressWhere = isInitialSync ? {
            OR: [
              { userId },
              { id: { in: bookingAddressIds } }
            ]
          } : {
            OR: [
              { userId },
              { id: { in: bookingAddressIds } }
            ],
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          addresses = await (this.prisma as any).address.findMany({
            where: providerAddressWhere,
          });
          const providerChatWhere = isInitialSync ? {
            OR: [
              { providerId: userId },
              { booking: { providerId: userId } }
            ]
          } : {
            OR: [
              { providerId: userId },
              { booking: { providerId: userId } }
            ],
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          chats = await (this.prisma as any).chat.findMany({
            where: providerChatWhere,
          });
          const providerMessageWhere = isInitialSync ? {
            chat: {
              OR: [
                { providerId: userId },
                { booking: { providerId: userId } }
              ]
            }
          } : {
            chat: {
              OR: [
                { providerId: userId },
                { booking: { providerId: userId } }
              ]
            },
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          messages = await (this.prisma as any).message.findMany({
            where: providerMessageWhere,
            include: {
              chat: true,
            },
          });
        }
        else {
          const clientBookingWhere = isInitialSync ? {
            clientId: userId
          } : {
            clientId: userId,
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          bookings = await (this.prisma as any).booking.findMany({
            where: clientBookingWhere,
            include: {
              address: true,
              service: true,
            },
          });
          const clientBookingAddressIds = bookings
            .map((booking: any) => booking.addressId)
            .filter(Boolean);
          const clientAddressWhere = isInitialSync ? {
            OR: [
              { userId },
              { id: { in: clientBookingAddressIds } },
            ],
          } : {
            OR: [
              {
                userId,
                updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate },
              },
              { id: { in: clientBookingAddressIds } },
            ],
          };
          addresses = await (this.prisma as any).address.findMany({
            where: clientAddressWhere,
          });
          const clientChatWhere = isInitialSync ? {
            OR: [
              { clientId: userId },
              { booking: { clientId: userId } }
            ]
          } : {
            OR: [
              { clientId: userId },
              { booking: { clientId: userId } }
            ],
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          chats = await (this.prisma as any).chat.findMany({
            where: clientChatWhere,
          });
          const clientMessageWhere = isInitialSync ? {
            chat: {
              OR: [
                { clientId: userId },
                { booking: { clientId: userId } }
              ]
            }
          } : {
            chat: {
              OR: [
                { clientId: userId },
                { booking: { clientId: userId } }
              ]
            },
            updatedAt: { gt: lastPulledDate, lte: syncBoundaryDate }
          };
          messages = await (this.prisma as any).message.findMany({
            where: clientMessageWhere,
            include: {
              chat: true,
            },
          });
        }
      }
      const chatIdMapping = new Map<string, string>();
      chats.forEach((chat: any) => {
        if (chat.id && chat.offlineId) {
          chatIdMapping.set(chat.id, chat.offlineId);
        }
      });
      const mapCategory = (r: any) => ({
        id: r.id,
        name_en: r.nameTranslations?.en || '',
        name_hi: r.nameTranslations?.hi || '',
        icon_url: r.iconUrl,
        order: r.order || 0,
        has_subcategories:
          (r._count?.subcategories > 0) || false,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });
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
      const mapService = (r: any) => ({
        id: r.id,
        category_id: r.categoryId,
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
        included_items_str: r.includedItems ? JSON.stringify(r.includedItems) : null,
        not_included_items_str: r.notIncludedItems ? JSON.stringify(r.notIncludedItems) : null,
        subcategory_name_en: r.subcategory?.nameTranslations?.en || null,
        estimated_time: r.estimatedTime || null,
        is_coming_soon: r.isComingSoon || false,
        duration_type: r.durationType || 'FLEXIBLE',
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });
      const mapBooking = (r: any) => ({
        id: r.offlineId || r.id,
        server_id: r.id,
        service_id: r.serviceId,
        client_id: r.clientId,
        provider_id: r.providerId,
        address_id: (r.address && r.address.offlineId) ? r.address.offlineId : r.addressId,
        status: r.status,
        scheduled_at: r.scheduledAt.getTime(),
        total_price: Number(r.totalPrice),
        items: JSON.stringify(r.items),
        otp: r.otp,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
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
        service: r.service ? {
          id: r.service.id,
          name_en: r.service.nameTranslations?.en || '',
          name_hi: r.service.nameTranslations?.hi || '',
          base_price: Number(r.service.basePrice),
        } : null,
        client: r.client ? {
          id: r.client.id,
          full_name: r.client.fullName,
          phone: r.client.phone,
        } : null,
      });
      const mapAddress = (r: any) => ({
        id: r.offlineId || r.id,
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
      const mapChat = (r: any) => ({
        id: r.offlineId || r.id,
        booking_id: r.bookingId,
        client_id: r.clientId,
        provider_id: r.providerId,
        server_id: r.id,
        created_at: r.createdAt.getTime(),
        updated_at: r.updatedAt.getTime(),
      });
      const mapMessage = (r: any) => {
        const localChatId = chatIdMapping.get(r.chatId) || r.chatId;
        return {
          id: r.offlineId || r.id,
          chat_id: localChatId,
          sender_id: r.senderId,
          content: r.content,
          server_id: r.id,
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        };
      };
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
      return {
        changes,
        timestamp: syncBoundary,
      };
    } catch (error) {
      throw error;
    }
  }
  async pushChanges(
    changes: any,
    lastPulledAt: number,
  ) {
    try {
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
      if (changes.bookings) {
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
          const assignedProvider = await this.findProviderForBooking(
            serviceId,
            bookingAddress,
          );
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
                ...(assignedProvider?.id
                  ? { providerId: assignedProvider.id }
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
              include: {
                service: true,
                client: true,
                address: true,
              },
            });
          const existingChat = await (this.prisma as any).chat.findFirst({
            where: { bookingId: newBooking.id },
          });
          if (!existingChat) {
            await (this.prisma as any).chat.create({
              data: {
                booking: {
                  connect: { id: newBooking.id },
                },
                clientId: newBooking.clientId,
                providerId: newBooking.providerId || 'system',
              },
            });
          }
          if (
            newBooking.status ===
            'PENDING'
          ) {
            const matchingProviders = await (this.prisma as any).user.findMany({
              where: {
                role: 'PROVIDER',
                profile: {
                  OR: [
                    { professionIds: { array_contains: newBooking.serviceId } },
                    { professionId: newBooking.serviceId }
                  ],
                },
              },
            });
            const matchingProviderIds = matchingProviders.map((p: any) => p.id);
            if (matchingProviderIds.length > 0) {
              this.trackingGateway.notifyProviders(
                matchingProviderIds,
                'new_booking',
                newBooking,
              );
            }
          }
        }
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
          let resolvedStatus =
            serverStatus;
          let resolvedScheduledAt =
            serverBooking.scheduledAt;
          if (
            localStatus === 'CANCELLED'
          ) {
            resolvedStatus =
              'CANCELLED';
          }
          else if (
            localPriority >
            serverPriority
          ) {
            resolvedStatus =
              localStatus;
          }
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
                  booking: {
                    connect: { id: booking.id },
                  },
                  clientId: chat.client_id || chat.clientId,
                  providerId: authoritativeProviderId,
                },
              });
            }
          }
        }
      }
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
            const messageOfflineId = msg.offlineId || msg.id;
            const whereClause = messageOfflineId
              ? { offlineId_chatId: { offlineId: messageOfflineId, chatId: chat.id } }
              : { id: msg.id };
            await (
              this.prisma as any
            ).message.upsert({
              where: whereClause,
              update: {
                content: msg.content,
                chatId: chat.id,
                version: {
                  increment: 1,
                },
              },
              create: {
                offlineId: messageOfflineId,
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
      return {
        status: 'ok',
      };
    } catch (error) {
      throw error;
    }
  }
}
