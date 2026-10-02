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
  async uploadImage(fileBase64: string, folder: string = 'cleaning-service') {
    try {
      const mimeType = this.extractMimeType(fileBase64);
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed`);
      }

      const fileSize = this.getBase64Size(fileBase64);
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (fileSize > maxSize) {
        throw new Error(`File size exceeds maximum limit of 5MB`);
      }

      const result = await cloudinary.uploader.upload(fileBase64, {
        folder,
        resource_type: 'image',
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

  private extractMimeType(base64: string): string {
    const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (!matches || !matches[1]) {
      return 'image/jpeg'; 
    }
    return matches[1];
  }

  private getBase64Size(base64: string): number {
    const base64Data = base64.replace(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+;base64,/, '');
    return Buffer.from(base64Data, 'base64').length;
  }
  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error) {
      this.logger.error('Delete failed', error);
      throw new Error('Failed to delete image');
    }
  }
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
  extractPublicId(url: string): string {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return url;
    const imagePart = parts[1].split('?')[0];
    const pathParts = imagePart.split('/');
    const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts = versionIndex >= 0 ? pathParts.slice(versionIndex + 1) : pathParts;
    const publicId = publicIdParts.join('/');
    return publicId.replace(/\.[^/.]+$/, '');
  }
  isConfigured(): boolean {
    return !!(
      this.configService.get('CLOUDINARY_CLOUD_NAME') &&
      this.configService.get('CLOUDINARY_API_KEY') &&
      this.configService.get('CLOUDINARY_API_SECRET')
    );
  }
}