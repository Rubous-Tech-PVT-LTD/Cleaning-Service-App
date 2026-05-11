import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private razorpay: any;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  async createOrder(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new BadRequestException('Booking not found');

    const options = {
      amount: Math.round(Number(booking.totalPrice) * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_booking_${booking.id}`,
    };

    try {
      if (!this.razorpay) {
        // Fallback for when keys are missing during development
        console.warn('Razorpay keys missing. Returning mock order ID.');
        return { id: `order_mock_${Date.now()}`, amount: options.amount, currency: 'INR' };
      }

      const order = await this.razorpay.orders.create(options);

      // Save order info to database
      await this.prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {
          razorpayOrderId: order.id,
          status: PaymentStatus.PENDING,
        },
        create: {
          bookingId: booking.id,
          amount: booking.totalPrice,
          razorpayOrderId: order.id,
          status: PaymentStatus.PENDING,
        },
      });

      return order;
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw new BadRequestException('Could not create Razorpay order');
    }
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    
    if (!secret) {
        console.warn('Razorpay secret missing. Skipping verification (Mock Success).');
        return { status: 'success' };
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpaySignature) {
      // Payment successful
      await this.prisma.payment.update({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: PaymentStatus.SUCCESS,
        },
      });

      return { status: 'success' };
    } else {
      throw new BadRequestException('Payment verification failed');
    }
  }
}
