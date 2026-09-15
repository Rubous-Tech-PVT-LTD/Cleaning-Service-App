import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Post('create-order')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Razorpay order for a booking' })
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.paymentsService.createOrder(createOrderDto.bookingId);
  }
  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(
      verifyPaymentDto.razorpayOrderId,
      verifyPaymentDto.razorpayPaymentId,
      verifyPaymentDto.razorpaySignature,
    );
  }
}
