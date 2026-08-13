import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP for login/signup' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phone);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and obtain JWT' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated, returns JWT.',
  })
  @ApiResponse({ status: 401, description: 'Invalid OTP.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user push token' })
  async updatePushToken(@Body() body: { userId: string; token: string }) {
    return this.authService.updatePushToken(body.userId, body.token);
  }

  @Post('register-provider')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new provider profile' })
  @ApiResponse({
    status: 201,
    description: 'Provider registered successfully.',
  })
  async registerProvider(@Body() registerDto: RegisterProviderDto) {
    return this.authService.registerProvider(registerDto);
  }
}
