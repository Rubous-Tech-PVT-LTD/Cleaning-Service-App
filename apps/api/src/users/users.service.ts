import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) { }
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
    const { fullName, ...userWithoutFullName } = user;
    return { name: fullName, fullName, ...userWithoutFullName };
  }
  async create(data: { phone: string, languagePref?: string }) {
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        languagePref: data.languagePref || 'hi',
        referralCode,
        profile: {
          create: {}
        }
      },
      include: { profile: true },
    });
  }
  async updateProfile(userId: string, data: any) {
    const { name, fullName, languagePref, avatar, addressLine1, addressLine2, city, state, pincode, latitude, longitude, bio, professionIds } = data;
    let avatarUrl = undefined;
    if (avatar && typeof avatar === 'string') {
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(avatar, 'profile-pictures');
        avatarUrl = uploadResult.url;
      } catch (error) {
      }
    }
    const userUpdate: any = {};
    const nameToUpdate = name || fullName;
    if (nameToUpdate !== undefined) userUpdate.fullName = nameToUpdate;
    if (languagePref !== undefined) userUpdate.languagePref = languagePref;
    const profileUpdateData: any = {};
    if (addressLine1 !== undefined) profileUpdateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) profileUpdateData.addressLine2 = addressLine2;
    if (city !== undefined) profileUpdateData.city = city;
    if (state !== undefined) profileUpdateData.state = state;
    if (pincode !== undefined) profileUpdateData.pincode = pincode;
    if (latitude !== undefined) profileUpdateData.latitude = latitude;
    if (longitude !== undefined) profileUpdateData.longitude = longitude;
    if (bio !== undefined) profileUpdateData.bio = bio;
    if (professionIds !== undefined) {
      profileUpdateData.professionIds = professionIds;
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
