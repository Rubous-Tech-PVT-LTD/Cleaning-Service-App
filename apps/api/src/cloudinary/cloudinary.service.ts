import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary credentials not configured');
    }
  }

  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(fileBase64: string, folder: string = 'cleaning-service') {
    try {
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder,
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
    } catch (error) {
      this.logger.error('Upload failed', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error) {
      this.logger.error('Delete failed', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Get optimized URL for mobile
   */
  getMobileUrl(publicId: string, width: number = 400): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: {
        width,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
      },
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return url;
    
    const imagePart = parts[1];
    const filename = imagePart.split('/').pop() || imagePart;
    return filename.split('.')[0];
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return !!(
      this.configService.get('CLOUDINARY_CLOUD_NAME') &&
      this.configService.get('CLOUDINARY_API_KEY') &&
      this.configService.get('CLOUDINARY_API_SECRET')
    );
  }
}