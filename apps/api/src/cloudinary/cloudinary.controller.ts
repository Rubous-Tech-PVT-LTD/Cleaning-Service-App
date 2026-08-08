import { Controller, Post, Delete, Body, Param, UseGuards, HttpException, HttpStatus, Get } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Upload a single image
   * POST /v1/cloudinary/upload
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  async uploadImage(@Body() body: { image: string; folder?: string }) {
    if (!body.image) {
      throw new HttpException('Image data is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.cloudinaryService.uploadImage(body.image, body.folder);
    return { success: true, data: result };
  }

  /**
   * Delete an image
   * DELETE /v1/cloudinary/:publicId
   */
  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  async deleteImage(@Param('publicId') publicId: string) {
    const result = await this.cloudinaryService.deleteImage(publicId);
    return { success: true, data: result };
  }

  /**
   * Get mobile-optimized URL
   * GET /v1/cloudinary/mobile/:publicId
   */
  @Get('mobile/:publicId')
  getMobileUrl(@Param('publicId') publicId: string, @Body() body?: { width?: number }) {
    const url = this.cloudinaryService.getMobileUrl(publicId, body?.width);
    return { success: true, data: { url } };
  }

  /**
   * Extract public ID from URL
   * POST /v1/cloudinary/extract-public-id
   */
  @Post('extract-public-id')
  extractPublicId(@Body() body: { url: string }) {
    if (!body.url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }
    const publicId = this.cloudinaryService.extractPublicId(body.url);
    return { success: true, data: { publicId } };
  }

  /**
   * Health check
   * GET /v1/cloudinary/health
   */
  @Get('health')
  healthCheck() {
    return {
      success: true,
      configured: this.cloudinaryService.isConfigured(),
    };
  }
}