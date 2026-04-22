import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        languagePref: data.languagePref || 'hi',
        profile: {
          create: {} // Create an empty profile by default
        }
      },
      include: { profile: true },
    });
  }

  async updateProfile(userId: string, data: any) {
    const { fullName, languagePref, ...profileData } = data;

    // Update User core fields
    const userUpdate: any = {};
    if (fullName !== undefined) userUpdate.fullName = fullName;
    if (languagePref !== undefined) userUpdate.languagePref = languagePref;

    // Handle JSON fields for SQLite (stored as strings)
    if (profileData.bio && typeof profileData.bio === 'object') {
      profileData.bio = JSON.stringify(profileData.bio);
    }
    if (profileData.availability && typeof profileData.availability === 'object') {
      profileData.availability = JSON.stringify(profileData.availability);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdate,
        profile: {
          update: {
            ...profileData
          }
        }
      },
      include: { profile: true },
    });
  }
}
