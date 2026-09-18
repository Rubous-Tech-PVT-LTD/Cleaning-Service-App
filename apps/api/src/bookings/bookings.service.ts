import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, Prisma, EscrowStatus, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
const DISTANCE_TIERS = {
  IDEAL: 5,
  GOOD: 10,
  ACCEPTABLE: 15,
  COMPENSATED: 25,
  FAR: 25,
};
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly trackingGateway: TrackingGateway,
  ) { }
  private async findSuitableProviders(clientLat: number, clientLon: number, serviceId: string) {
    const providers = await this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        profile: {
          isVerified: true,
          latitude: { not: null },
          longitude: { not: null },
          OR: [
            { professionIds: { array_contains: serviceId } },
            { professionId: serviceId }
          ]
        },
      },
      include: {
        profile: true,
      },
    });
    const providersWithDistance = providers
      .map(provider => {
        const distance = calculateDistance(
          clientLat,
          clientLon,
          provider.profile!.latitude!,
          provider.profile!.longitude!
        );
        const tier = this.getDistanceTier(distance);
        return {
          provider,
          distance,
          tier,
        };
      })
      .filter(p => p.tier !== 'FAR')
      .sort((a, b) => a.distance - b.distance);
    return providersWithDistance;
  }
  private getDistanceTier(distance: number): string {
    if (distance <= DISTANCE_TIERS.IDEAL) return 'IDEAL';
    if (distance <= DISTANCE_TIERS.GOOD) return 'GOOD';
    if (distance <= DISTANCE_TIERS.ACCEPTABLE) return 'ACCEPTABLE';
    if (distance <= DISTANCE_TIERS.COMPENSATED) return 'COMPENSATED';
    return 'FAR';
  }
  async create(clientId: string, createBookingDto: CreateBookingDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: createBookingDto.addressId },
    });
    if (!address || !address.latitude || !address.longitude) {
      throw new BadRequestException('Booking address must have valid coordinates');
    }
    let assignedProviderId = createBookingDto.providerId;
    if (!assignedProviderId) {
      const suitableProviders = await this.findSuitableProviders(
        address.latitude,
        address.longitude,
        createBookingDto.serviceId
      );
      const idealProvider = suitableProviders.find(p => p.tier === 'IDEAL');
      if (idealProvider) {
        assignedProviderId = idealProvider.provider.id;
      }
      else {
        const goodProvider = suitableProviders.find(p => p.tier === 'GOOD');
        if (goodProvider) {
          assignedProviderId = goodProvider.provider.id;
        }
        else {
          const acceptableProvider = suitableProviders.find(p => p.tier === 'ACCEPTABLE');
          if (acceptableProvider) {
            assignedProviderId = acceptableProvider.provider.id;
          }
          else {
            const compensatedProvider = suitableProviders.find(p => p.tier === 'COMPENSATED');
            if (compensatedProvider) {
              assignedProviderId = compensatedProvider.provider.id;
              const travelCompensation = 150;
              createBookingDto.totalPrice = Number(createBookingDto.totalPrice) + travelCompensation;
            }
          }
        }
      }
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        serviceId: createBookingDto.serviceId,
        providerId: assignedProviderId,
        addressId: createBookingDto.addressId,
        scheduledAt: new Date(createBookingDto.scheduledAt),
        totalPrice: createBookingDto.totalPrice,
        offlineId: createBookingDto.offlineId,
        status: BookingStatus.PENDING,
        otp: otp,
      },
      include: {
        service: true,
        client: true,
        address: true,
      },
    });
    if (booking.providerId) {
      this.trackingGateway.notifyUser(booking.providerId, 'new_booking', booking);
      const provider = await this.prisma.user.findUnique({
        where: { id: booking.providerId },
      });
      await this.notifications.notifyBookingStatusChange(
        provider?.pushToken,
        booking.id,
        booking.status,
        'new service request'
      ).catch(() => { });
    } else {
      const matchingProviders = await this.prisma.user.findMany({
        where: {
          role: UserRole.PROVIDER,
          profile: {
            OR: [
              { professionIds: { array_contains: createBookingDto.serviceId } },
              { professionId: createBookingDto.serviceId }
            ],
          },
        },
      });
      const matchingProviderIds = matchingProviders.map(p => p.id);
      if (matchingProviderIds.length > 0) {
        this.trackingGateway.notifyProviders(matchingProviderIds, 'new_booking', booking);
      }
    }
    return booking;
  }
  async completeAll() {
    return this.prisma.booking.updateMany({
      data: { status: BookingStatus.COMPLETED }
    });
  }
  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.booking.findMany({
        include: { service: true, client: true, provider: true, address: true },
      });
    }
    if (role === 'PROVIDER') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
      const professionIds: string[] = [];
      if (user?.profile?.professionId) {
        professionIds.push(user.profile.professionId);
      }
      if (user?.profile?.professionIds && Array.isArray(user.profile.professionIds)) {
        professionIds.push(...(user.profile.professionIds as string[]));
      }
      return this.prisma.booking.findMany({
        where: {
          OR: [
            { providerId: userId },
            {
              status: 'PENDING',
              serviceId: { in: professionIds }
            }
          ]
        },
        include: { service: true, client: true, provider: true, address: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.booking.findMany({
      where: { clientId: userId },
      include: { service: true, client: true, provider: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findOne(id: string, user?: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true, client: true, provider: true, review: true, address: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user) {
      const isOwner = booking.clientId === user.id || booking.providerId === user.id;
      const isAdmin = user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Access denied: You can only access your own bookings');
      }
    }
    return booking;
  }
  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto, user?: any) {
    const updateData: any = { status: updateStatusDto.status };
    const currentBooking = await this.prisma.booking.findUnique({ where: { id } });
    if (!currentBooking) throw new NotFoundException('Booking not found');
    
    // Authorization checks based on the recommended authorization matrix
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isClient = user.role === UserRole.CLIENT;
    const isProvider = user.role === UserRole.PROVIDER;
    const isOwner = currentBooking.clientId === user.id;
    const isAssignedProvider = currentBooking.providerId === user.id;

    // Validate status transitions based on user role and booking ownership
    switch (updateStatusDto.status) {
      case BookingStatus.CANCELLED:
        // Cancel booking: Own booking (client), assigned booking (provider), or admin
        if (!isAdmin && !isOwner && !isAssignedProvider) {
          throw new ForbiddenException('You can only cancel your own bookings or bookings assigned to you');
        }
        // Additional business rule: can only cancel bookings in certain statuses
        const cancelableStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];
        if (!isAdmin && !cancelableStatuses.includes(currentBooking.status)) {
          throw new BadRequestException('Cannot cancel bookings that are already completed or cancelled');
        }
        break;

      case BookingStatus.ACCEPTED:
        // Accept booking: Only eligible assigned/claimable booking (provider) or admin
        if (!isAdmin) {
          if (!isProvider) {
            throw new ForbiddenException('Only providers can accept bookings');
          }
          // Provider can accept if they are assigned or if the booking is pending and unassigned
          if (!isAssignedProvider && currentBooking.status !== BookingStatus.PENDING) {
            throw new ForbiddenException('You can only accept bookings assigned to you or pending bookings');
          }
          if (currentBooking.status !== BookingStatus.PENDING) {
            throw new BadRequestException('Can only accept pending bookings');
          }
        }
        break;

      case BookingStatus.IN_PROGRESS:
        // Start service: Assigned provider or admin
        if (!isAdmin) {
          if (!isProvider) {
            throw new ForbiddenException('Only providers can start services');
          }
          if (!isAssignedProvider) {
            throw new ForbiddenException('You can only start services for bookings assigned to you');
          }
          if (currentBooking.status !== BookingStatus.ACCEPTED) {
            throw new BadRequestException('Can only start services for accepted bookings');
          }
        }
        break;

      case BookingStatus.COMPLETED:
        // Complete service: Assigned provider + OTP or admin
        if (!isAdmin) {
          if (!isProvider) {
            throw new ForbiddenException('Only providers can complete services');
          }
          if (!isAssignedProvider) {
            throw new ForbiddenException('You can only complete services for bookings assigned to you');
          }
          if (!currentBooking.otp) {
            throw new BadRequestException('This booking does not have an OTP set up.');
          }
          if (currentBooking.otp !== updateStatusDto.otp) {
            throw new BadRequestException('Invalid OTP. Please ask the client for the correct 4-digit PIN.');
          }
          if (currentBooking.status !== BookingStatus.IN_PROGRESS) {
            throw new BadRequestException('Can only complete services that are in progress');
          }
        }
        break;

      case BookingStatus.PENDING:
        // Reset to pending: Admin only (override)
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can reset booking status to pending');
        }
        break;

      default:
        // Any other status change: Admin only
        if (!isAdmin) {
          throw new ForbiddenException('Invalid status transition for your role');
        }
        break;
    }
    const booking = await this.prisma.$transaction(async (tx: any) => {
      if (updateStatusDto.status === BookingStatus.ACCEPTED && isProvider) {
        updateData.providerId = user.id;
        const existingChat = await tx.chat.findFirst({
          where: { bookingId: id },
        });
        if (existingChat) {
          await tx.chat.update({
            where: { id: existingChat.id },
            data: {
              providerId: user.id,
              updatedAt: new Date(),
            },
          });
        } else if (currentBooking.clientId) {
          await tx.chat.create({
            data: {
              bookingId: id,
              clientId: currentBooking.clientId,
              providerId: user.id,
            },
          });
        }
      }
      return tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          service: true,
          client: true,
          address: true,
        },
      });
    });
    const serviceName =
      (booking.service as any)?.nameTranslations?.en ||
      (booking.service as any)?.nameTranslations ||
      'your service';
    await this.notifications.notifyBookingStatusChange(
      booking.client?.pushToken,
      booking.id,
      booking.status,
      serviceName,
    ).catch(() => { });
    if (updateStatusDto.status === BookingStatus.COMPLETED) {
      await this.prisma.payment.update({
        where: { bookingId: id },
        data: { escrowStatus: EscrowStatus.RELEASED },
      }).catch(() => {
      });
    }
    if (booking.clientId) {
      this.trackingGateway.notifyUser(booking.clientId, 'sync_ping', { bookingId: booking.id, offlineId: booking.offlineId });
      this.trackingGateway.notifyUser(booking.clientId, 'booking_status_changed', {
        bookingId: booking.id,
        offlineId: booking.offlineId,
        status: booking.status,
        otp: booking.otp,
        updatedAt: booking.updatedAt
      });
      if (updateStatusDto.status === BookingStatus.ACCEPTED) {
        this.trackingGateway.notifyUser(booking.clientId, 'booking_accepted', booking);
      }
    }
    if (booking.providerId) {
      this.trackingGateway.notifyUser(booking.providerId, 'booking_status_changed', {
        bookingId: booking.id,
        offlineId: booking.offlineId,
        status: booking.status,
        otp: booking.otp,
        updatedAt: booking.updatedAt
      });
    }
    return booking;
  }
}
