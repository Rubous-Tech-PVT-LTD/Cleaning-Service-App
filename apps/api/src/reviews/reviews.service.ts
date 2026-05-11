import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, createReviewDto: CreateReviewDto) {
    // 1. Check if the booking exists and belongs to the client
    const booking = await this.prisma.booking.findUnique({
      where: { id: createReviewDto.bookingId },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== clientId) {
      throw new BadRequestException('You can only review your own bookings');
    }

    // 2. Ensure the booking is COMPLETED
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('You can only review completed bookings');
    }

    // 3. Check if a review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId: createReviewDto.bookingId },
    });
    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    // 4. Create the review
    const review = await this.prisma.review.create({
      data: {
        bookingId: createReviewDto.bookingId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      },
    });

    // 5. Update provider's average rating (Async or Simple update)
    if (booking.providerId) {
      await this.updateProviderRating(booking.providerId);
    }

    return review;
  }

  async findByService(serviceId: string) {
    return this.prisma.review.findMany({
      where: {
        booking: { serviceId },
      },
      include: {
        booking: {
          select: {
            client: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async updateProviderRating(providerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        booking: { providerId },
      },
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await this.prisma.profile.update({
        where: { userId: providerId },
        data: { rating: avgRating },
      });
    }
  }
}
