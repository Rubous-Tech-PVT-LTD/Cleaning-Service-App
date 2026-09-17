import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Razorpay order for a booking' })
  createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.paymentsService.createOrder(createOrderDto.bookingId, req.user.id);
  }
  @Post('verify')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  verifyPayment(@Request() req: any, @Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(
      verifyPaymentDto.razorpayOrderId,
      verifyPaymentDto.razorpayPaymentId,
      verifyPaymentDto.razorpaySignature,
      req.user.id,
    );
  }
}
