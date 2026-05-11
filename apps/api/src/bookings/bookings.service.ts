import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus, EscrowStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, createBookingDto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        clientId,
        serviceId: createBookingDto.serviceId,
        providerId: createBookingDto.providerId,
        scheduledAt: new Date(createBookingDto.scheduledAt),
        totalPrice: createBookingDto.totalPrice,
        offlineId: createBookingDto.offlineId,
        status: BookingStatus.PENDING,
      },
      include: {
        service: true,
        client: true,
      },
    });
  }

  async completeAll() {
    return this.prisma.booking.updateMany({
      data: { status: BookingStatus.COMPLETED }
    });
  }

  async findAll(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.booking.findMany({
        include: { service: true, client: true, provider: true },
      });
    }

    return this.prisma.booking.findMany({
      where: role === 'PROVIDER' ? { providerId: userId } : { clientId: userId },
      include: { service: true, client: true, provider: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true, client: true, provider: true, review: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });

    if (updateStatusDto.status === BookingStatus.COMPLETED) {
      await this.prisma.payment.update({
        where: { bookingId: id },
        data: { escrowStatus: EscrowStatus.RELEASED },
      }).catch(() => {
        console.warn(`Payment record not found for booking ${id}, skipping escrow release.`);
      });
    }

    return booking;
  }
}
