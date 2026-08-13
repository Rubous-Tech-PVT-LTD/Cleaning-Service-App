import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  async findAll(categoryId?: string) {
    return this.prisma.service.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: {
          select: { nameTranslations: true },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateServiceImage(serviceId: string, imageBase64: string) {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(imageBase64, 'services');
      
      return this.prisma.service.update({
        where: { id: serviceId },
        data: { imageUrl: uploadResult.url },
      });
    } catch (error) {
      throw new Error('Failed to update service image');
    }
  }
}
