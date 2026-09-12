import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
interface PricingResult {
  price: number;
  formattedDuration: string;
}
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}
  async calculatePrice(serviceId: string, duration?: any): Promise<number> {
    if (serviceId === 'hourly-service' && duration && duration.price) {
      const durationPrice = Number(duration.price);
      return durationPrice;
    }
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { 
        basePrice: true,
        estimatedTime: true,
        id: true,
        status: true,
        durationType: true
      },
    });
    if (!service) {
      throw new BadRequestException(`Service with ID ${serviceId} does not exist`);
    }
    if (service.status !== 'ACTIVE') {
      throw new BadRequestException(`Service ${serviceId} is not available`);
    }
    const basePrice = Number(service.basePrice);
    if (service.durationType === 'FIXED') {
      return basePrice;
    }
    const baseEstimatedTime = this.parseEstimatedTime(service.estimatedTime);
    if (duration && duration.label) {
      const currentDuration = this.parseDurationMinutes(duration.label);
      const calculatedPrice = Math.round((basePrice / baseEstimatedTime) * currentDuration);
      return calculatedPrice;
    }
    return basePrice;
  }
  private parseEstimatedTime(estimatedTime: string | null): number {
    if (!estimatedTime) return 60; 
    const match = estimatedTime.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    if (!match) return 60;
    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit.includes('hr') || unit.includes('hour')) {
      return value * 60; 
    }
    return value; 
  }
  private parseDurationMinutes(durationLabel: string): number {
    const match = durationLabel.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    if (!match) return 60;
    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit.includes('hr') || unit.includes('hour')) {
      return value * 60; 
    }
    return value; 
  }
  private parseDurationMultiplier(durationLabel: string): number {
    const match = durationLabel.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    if (!match) {
      return 1.0;
    }
    const value = parseFloat(match[1]);
    const unit = (match[3] || '').toLowerCase();
    if (unit.includes('hr') || unit.includes('hour')) {
      return value; 
    }
    if (unit.includes('min')) {
      return value / 60; 
    }
    return value / 60;
  }
  async getBasePrice(serviceId: string): Promise<number> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { basePrice: true },
    });
    if (!service) {
      throw new BadRequestException(`Service with ID ${serviceId} does not exist`);
    }
    return Number(service.basePrice);
  }
}
