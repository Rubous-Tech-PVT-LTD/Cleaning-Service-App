import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subcategory.findMany({
      include: {
        category: true,
        _count: {
          select: { services: true }
        }
      }
    });
  }

  async findByCategory(categoryId: string) {
    // Validate that the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.prisma.subcategory.findMany({
      where: { categoryId },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });
  }

  async findOne(id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
        services: true,
        _count: {
          select: { services: true }
        }
      }
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async create(createSubcategoryDto: CreateSubcategoryDto) {
    // Validate that the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createSubcategoryDto.categoryId }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createSubcategoryDto.categoryId} not found`);
    }

    // Check for duplicate slug within the category
    const existing = await this.prisma.subcategory.findFirst({
      where: {
        categoryId: createSubcategoryDto.categoryId,
        slug: createSubcategoryDto.slug
      }
    });

    if (existing) {
      throw new ConflictException(
        `Subcategory with slug '${createSubcategoryDto.slug}' already exists in this category`
      );
    }

    return this.prisma.subcategory.create({
      data: {
        categoryId: createSubcategoryDto.categoryId,
        nameTranslations: createSubcategoryDto.nameTranslations as any,
        slug: createSubcategoryDto.slug,
        iconUrl: createSubcategoryDto.iconUrl
      },
      include: {
        category: true,
        _count: {
          select: { services: true }
        }
      }
    });
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto) {
    const subcategory = await (this.prisma as any).subcategory.findUnique({
      where: { id }
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    // If changing category, validate it exists
    if (updateSubcategoryDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateSubcategoryDto.categoryId }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateSubcategoryDto.categoryId} not found`);
      }
    }

    // If changing slug, check for duplicates
    if (updateSubcategoryDto.slug) {
      const categoryId = updateSubcategoryDto.categoryId || subcategory.categoryId;
      const existing = await this.prisma.subcategory.findFirst({
        where: {
          categoryId,
          slug: updateSubcategoryDto.slug,
          id: { not: id } // Exclude current subcategory
        }
      });

      if (existing) {
        throw new ConflictException(
          `Subcategory with slug '${updateSubcategoryDto.slug}' already exists in this category`
        );
      }
    }

    return this.prisma.subcategory.update({
      where: { id },
      data: {
        ...(updateSubcategoryDto.categoryId && { categoryId: updateSubcategoryDto.categoryId }),
        ...(updateSubcategoryDto.nameTranslations && { nameTranslations: updateSubcategoryDto.nameTranslations as any }),
        ...(updateSubcategoryDto.slug && { slug: updateSubcategoryDto.slug }),
        ...(updateSubcategoryDto.iconUrl !== undefined && { iconUrl: updateSubcategoryDto.iconUrl })
      } as any,
      include: {
        category: true,
        _count: {
          select: { services: true }
        }
      }
    });
  }

  async remove(id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    // Prevent deletion if subcategory has services
    if (subcategory._count.services > 0) {
      throw new BadRequestException(
        'Cannot delete subcategory with associated services. Please reassign or delete the services first.'
      );
    }

    await this.prisma.subcategory.delete({
      where: { id }
    });
  }
}
