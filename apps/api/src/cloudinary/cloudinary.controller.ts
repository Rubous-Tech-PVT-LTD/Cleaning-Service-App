import { Controller, Post, Delete, Body, Param, UseGuards, HttpException, HttpStatus, Get, Request, ForbiddenException } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
@Controller('cloudinary')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}
  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @UseGuards(JwtAuthGuard)
  async uploadImage(@Body() body: { image: string; folder?: string }) {
    if (!body.image) {
      throw new HttpException('Image data is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!body.image.startsWith('data:image/')) {
      throw new HttpException('Invalid image format. Must be a base64 encoded image', HttpStatus.BAD_REQUEST);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const mimeType = body.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)?.[1];
    
    if (!mimeType || !allowedMimeTypes.includes(mimeType)) {
      throw new HttpException(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed`, HttpStatus.BAD_REQUEST);
    }

    const result = await this.cloudinaryService.uploadImage(body.image, body.folder);
    return { success: true, data: result };
  }
  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  async deleteImage(@Param('publicId') publicId: string, @Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profile: { select: { avatarUrl: true } } },
    });
    const ownedPublicId = user?.profile?.avatarUrl
      ? this.cloudinaryService.extractPublicId(user.profile.avatarUrl)
      : undefined;

    if (!ownedPublicId || ownedPublicId !== publicId) {
      throw new ForbiddenException('You can only delete your own profile image');
    }

    const result = await this.cloudinaryService.deleteImage(publicId);
    return { success: true, data: result };
  }
  @Get('mobile/:publicId')
  getMobileUrl(@Param('publicId') publicId: string, @Body() body?: { width?: number }) {
    const url = this.cloudinaryService.getMobileUrl(publicId, body?.width);
    return { success: true, data: { url } };
  }
  @Post('extract-public-id')
  extractPublicId(@Body() body: { url: string }) {
    if (!body.url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }
    const publicId = this.cloudinaryService.extractPublicId(body.url);
    return { success: true, data: { publicId } };
  }
  @Get('health')
  @SkipThrottle()
  healthCheck() {
    return {
      success: true,
      configured: this.cloudinaryService.isConfigured(),
    };
  }
}