import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('otp/request')
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request an OTP for login/signup' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto.phone);
  }
  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and obtain JWT' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated, returns JWT.' })
  @ApiResponse({ status: 401, description: 'Invalid OTP.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user push token' })
  async updatePushToken(@Request() req: any, @Body() body: { token: string }) {
    return this.authService.updatePushToken(req.user.sub, body.token);
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear session data' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  async logout(@Request() req: any, @Body() body?: { refreshToken?: string }) {
    return this.authService.logout(req.user.sub, body?.refreshToken);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Successfully refreshed tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }
  @Post('register-provider')
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new provider profile' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully.' })
  async registerProvider(@Body() registerDto: RegisterProviderDto) {
    return this.authService.registerProvider(registerDto);
  }
}
