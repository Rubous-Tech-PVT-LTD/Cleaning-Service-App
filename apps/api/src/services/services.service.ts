import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(categoryId?: string) {
    return this.prisma.service.findMany({
      where: categoryId ? { categoryId } : {},
      include: {
        category: {
          select: { nameTranslations: true }
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { category: true }
    });
  }
}
