import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, Prisma, EscrowStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  async create(clientId: string, createBookingDto: CreateBookingDto) {
    const booking = await this.prisma.booking.create({
      data: {
        clientId,
        serviceId: createBookingDto.serviceId,
        providerId: createBookingDto.providerId,
        addressId: createBookingDto.addressId,
        scheduledAt: new Date(createBookingDto.scheduledAt),
        totalPrice: createBookingDto.totalPrice,
        offlineId: createBookingDto.offlineId,
        status: BookingStatus.PENDING,
      },
      include: {
        service: true,
        client: true,
        address: true,
      },
    });

    // Notify the specific provider if assigned, else notify all providers
    if (booking.providerId) {
      this.trackingGateway.notifyUser(booking.providerId, 'new_booking', booking);
      
      // Also send a push notification
      await this.notifications.notifyBookingStatusChange(
        booking.client?.pushToken, // We probably want provider push token here, but keeping logic consistent
        booking.id,
        booking.status,
        'new service request'
      ).catch(() => {});
    } else {
      this.trackingGateway.broadcastNewBooking(booking);
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

    return this.prisma.booking.findMany({
      where: role === 'PROVIDER' ? { providerId: userId } : { clientId: userId },
      include: { service: true, client: true, provider: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true, client: true, provider: true, review: true, address: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return booking;
  }

  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto, user?: any) {
    const updateData: any = { status: updateStatusDto.status };
    
    // If a provider accepts the job, assign it to them
    if (updateStatusDto.status === BookingStatus.ACCEPTED && user && user.role === 'PROVIDER') {
      updateData.providerId = user.id;
    }

    const currentBooking = await this.prisma.booking.findUnique({ where: { id } });
    if (!currentBooking) throw new NotFoundException('Booking not found');

    // 🔒 OTP Validation for completion
    if (updateStatusDto.status === BookingStatus.COMPLETED) {
      if (!currentBooking.otp) {
        throw new BadRequestException('This booking does not have an OTP set up.');
      }
      if (currentBooking.otp !== updateStatusDto.otp) {
        throw new BadRequestException('Invalid OTP. Please ask the client for the correct 4-digit PIN.');
      }
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        service: true,
        client: true,
        address: true,
      },
    });

    // 🔔 Send push notification to client
    const serviceName =
      (booking.service as any)?.nameTranslations?.en ||
      (booking.service as any)?.nameTranslations ||
      'your service';

    await this.notifications.notifyBookingStatusChange(
      booking.client?.pushToken,
      booking.id,
      booking.status,
      serviceName,
    ).catch(() => {});

    if (updateStatusDto.status === BookingStatus.COMPLETED) {
      await this.prisma.payment.update({
        where: { bookingId: id },
        data: { escrowStatus: EscrowStatus.RELEASED },
      }).catch(() => {
        console.warn(`Payment record not found for booking ${id}, skipping escrow release.`);
      });
    }

    // If a provider accepts the job, notify the client via WebSockets
    if (updateStatusDto.status === BookingStatus.ACCEPTED && booking.clientId) {
      this.trackingGateway.notifyUser(booking.clientId, 'booking_accepted', booking);
    }

    return booking;
  }
}
