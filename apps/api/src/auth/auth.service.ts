// Force TS re-evaluation
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterProviderDto } from './dto/register-provider.dto';

@Injectable()
export class AuthService {
  // MOCK IN-MEMORY STORAGE FOR OTPs (Instead of Redis for now)
  private otpStore = new Map<string, string>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async requestOtp(phone: string): Promise<{ message: string; devCode?: string }> {
    // Generate a random 6-digit OTP (Mock: always '123456' for +919999999999 for test purposes)
    const code = phone === '+919999999999' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it temporarily
    this.otpStore.set(phone, code);
    
    // 🚧 In production, integrate Firebase or MSG91 here 🚧
    console.log(`\n\n[MOCK SMS] 🟢 Sent OTP '${code}' to phone '${phone}'\n\n`);

    // DEV ONLY: return code in response for easy testing
    return { message: 'OTP sent successfully', devCode: code };
  }

  async verifyOtp(phone: string, code: string) {
    const storedCode = this.otpStore.get(phone);
    
    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Clear the OTP
    this.otpStore.delete(phone);

    // Get or Create User
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      // Create new user with default Hindi preference
      user = await this.usersService.create({ phone, languagePref: 'hi' });
    }

    // Generate JWT Access Token
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async updatePushToken(userId: string, token: string) {
    return this.usersService.update(userId, { pushToken: token });
  }

  async registerProvider(dto: RegisterProviderDto) {
    // Check if user exists by phone
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          email: dto.email,
          fullName: dto.fullName,
          role: 'PROVIDER',
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: dto.email,
          fullName: dto.fullName,
          role: 'PROVIDER',
        },
      });
    }

    // Upsert Profile
    await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        addressLine1: dto.addressLine1,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        professionId: dto.professionId,
        documents: dto.documents || {},
        isVerified: true, // Automatically accept as per request
      },
      create: {
        userId: user.id,
        addressLine1: dto.addressLine1,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        latitude: dto.latitude,
        longitude: dto.longitude,
        professionId: dto.professionId,
        documents: dto.documents || {},
        isVerified: true,
      },
    });

    // We don't automatically request OTP here; we let the controller or client trigger it 
    // to match the requested flow.
    return { success: true, message: 'Provider registered successfully' };
  }
}
