import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: {
            services: true,
            subcategories: true
          }
        },
        subcategories: true
      }
    });

    return categories.map((category) => ({
      ...category,
      hasSubcategories: (category._count as any)?.subcategories > 0 || false
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        services: true,
        subcategories: true,
        _count: {
          select: {
            subcategories: true
          }
        }
      }
    });

    if (!category) return null;

    return {
      ...category,
      hasSubcategories: (category._count as any)?.subcategories > 0 || false
    };
  }
}
