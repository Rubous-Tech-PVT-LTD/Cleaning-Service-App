import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSosDto } from './dto/create-sos.dto';
import { BookingStatus, SosRole, SosStatus } from '@prisma/client';

const ELIGIBLE_STATUSES: BookingStatus[] = [BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS];

@Injectable()
export class SosService {
  constructor(private readonly prisma: PrismaService) {}

  async triggerSos(userId: string, createSosDto: CreateSosDto) {
    const { bookingId, latitude, longitude } = createSosDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Authenticated user not found');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.clientId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('You are not part of this booking');
    }

    if (!ELIGIBLE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        `SOS can only be triggered for bookings in status: ${ELIGIBLE_STATUSES.join(', ')}. Current status: ${booking.status}`
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Coordinates are out of valid range');
    }

    const raisedByRole: SosRole = booking.clientId === userId ? SosRole.CLIENT : SosRole.PROVIDER;

    const sos = await this.prisma.sos.create({
      data: {
        bookingId,
        raisedByUserId: userId,
        raisedByRole,
        latitude,
        longitude,
        status: SosStatus.ACTIVE,
      },
      include: {
        booking: true,
        raisedByUser: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const timestamp = new Date().toISOString();

    console.log('\n');
    console.log('======================================== SOS ALERT ========================================');
    console.log(`[${timestamp}] SOS TRIGGERED BY: ${raisedByRole}`);
    console.log(`  User ID    : ${userId}`);
    console.log(`  User Name  : ${sos.raisedByUser.fullName ?? 'N/A'}`);
    console.log(`  User Phone : ${sos.raisedByUser.phone ?? 'N/A'}`);
    console.log(`  Booking ID : ${bookingId}`);
    console.log(`  Booking Status : ${booking.status}`);
    console.log(`  Latitude   : ${latitude}`);
    console.log(`  Longitude  : ${longitude}`);
    console.log(`  Location   : ${googleMapsLink}`);
    console.log('=============================================================================================');
    console.log('\n');

    return sos;
  }
}
