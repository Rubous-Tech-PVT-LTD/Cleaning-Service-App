import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  // MOCK IN-MEMORY STORAGE FOR OTPs (Instead of Redis for now)
  private otpStore = new Map<string, string>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(phone: string): Promise<{ message: string }> {
    // Generate a random 6-digit OTP (Mock: always '123456' for +919999999999 for test purposes)
    const code = phone === '+919999999999' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it temporarily
    this.otpStore.set(phone, code);
    
    // 🚧 In production, integrate Firebase or MSG91 here 🚧
    console.log(`\n\n[MOCK SMS] 🟢 Sent OTP '${code}' to phone '${phone}'\n\n`);

    return { message: 'OTP sent successfully' };
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
}
