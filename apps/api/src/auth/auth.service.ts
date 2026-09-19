import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, string>();
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateFamilyId(): string {
    return crypto.randomUUID();
  }
  async requestOtp(phone: string): Promise<{ message: string; devCode?: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(phone, code);
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Login OTP for ${phone}: ${code}`);
    }
    return { message: 'OTP sent successfully', devCode: code };
  }
  async verifyOtp(phone: string, code: string) {
    const storedCode = this.otpStore.get(phone);
    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    this.otpStore.delete(phone);
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.create({ phone, languagePref: 'hi' });
    }
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
    
    const refreshToken = this.generateRefreshToken();
    const familyId = this.generateFamilyId();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        familyId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
  async updatePushToken(userId: string, token: string) {
    return this.usersService.update(userId, { pushToken: token });
  }

  async logout(userId: string, refreshToken?: string) {
    this.logger.log(`User logged out: ${userId}`);
    if (userId) {
      try {
        await this.usersService.update(userId, { pushToken: null });
      } catch (error) {
        this.logger.warn(`Failed to clear push token for user ${userId}:`, error);
      }
    }
    
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      try {
        await this.prisma.refreshToken.updateMany({
          where: { tokenHash, userId },
          data: { revoked: true },
        });
      } catch (error) {
        this.logger.warn(`Failed to revoke refresh token for user ${userId}:`, error);
      }
    }
    
    return { success: true, message: 'Logged out successfully' };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existingToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!existingToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (existingToken.replacedBy) {
        await tx.refreshToken.updateMany({
          where: { familyId: existingToken.familyId },
          data: { revoked: true },
        });
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      const newRefreshToken = this.generateRefreshToken();
      const newTokenHash = this.hashToken(newRefreshToken);
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revoked: true, replacedBy: newTokenHash },
      });

      await tx.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: existingToken.userId,
          familyId: existingToken.familyId,
          expiresAt: newExpiresAt,
        },
      });

      const user = await tx.user.findUnique({
        where: { id: existingToken.userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = { sub: user.id, phone: user.phone, role: user.role };
      const accessToken = this.jwtService.sign(payload, { expiresIn: this.ACCESS_TOKEN_EXPIRY });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      };
    });

    return result;
  }
  async registerProvider(dto: RegisterProviderDto) {
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
    const professionIds = dto.professionIds || [dto.professionId];
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
        professionIds: professionIds,
        documents: dto.documents || {},
        isVerified: true, 
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
        professionIds: professionIds,
        documents: dto.documents || {},
        isVerified: true,
      },
    });
    return { success: true, message: 'Provider registered successfully' };
  }
}
