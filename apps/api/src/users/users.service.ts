import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async create(data: { phone: string, languagePref?: string }) {
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        languagePref: data.languagePref || 'hi',
        referralCode,
        profile: {
          create: {} // Create an empty profile by default
        }
      },
      include: { profile: true },
    });
  }

  async updateProfile(userId: string, data: any) {
    const { fullName, languagePref, avatar, professionIds, ...profileData } = data;

    // Upload avatar to Cloudinary if provided
    let avatarUrl = undefined;
    if (avatar && typeof avatar === 'string') {
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(avatar, 'profile-pictures');
        avatarUrl = uploadResult.url;
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      }
    }

    // Update User core fields
    const userUpdate: any = {};
    if (fullName !== undefined) userUpdate.fullName = fullName;
    if (languagePref !== undefined) userUpdate.languagePref = languagePref;

    // Handle professionIds as JSON array
    const profileUpdateData: any = { ...profileData };
    if (professionIds !== undefined) {
      profileUpdateData.professionIds = professionIds;
      // For backward compatibility, also set the first professionId as the primary professionId
      if (professionIds.length > 0) {
        profileUpdateData.professionId = professionIds[0];
      } else {
        profileUpdateData.professionId = null;
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdate,
        profile: {
          update: {
            ...profileUpdateData,
            ...(avatarUrl && { avatarUrl })
          }
        }
      },
      include: { profile: true },
    });
  }

  async update(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { profile: true },
    });
  }
}
