import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PricingResult {
  price: number;
  formattedDuration: string;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate price based on service base price and duration
   * @param serviceId - ID of the service
   * @param duration - Duration object with label and value
   * @returns Calculated price
   */
  async calculatePrice(serviceId: string, duration?: any): Promise<number> {
    // For hourly services, use the duration price if provided
    if (serviceId === 'hourly-service' && duration && duration.price) {
      const durationPrice = Number(duration.price);
      console.log(`Hourly service pricing: Using duration price ₹${durationPrice}`);
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
    
    // For FIXED duration services, always use base price regardless of duration
    if (service.durationType === 'FIXED') {
      console.log(`Service ${serviceId}: FIXED duration - using base price ₹${basePrice}`);
      return basePrice;
    }

    // For FLEXIBLE duration services, calculate price based on duration
    const baseEstimatedTime = this.parseEstimatedTime(service.estimatedTime);
    
    if (duration && duration.label) {
      const currentDuration = this.parseDurationMinutes(duration.label);
      const calculatedPrice = Math.round((basePrice / baseEstimatedTime) * currentDuration);
      console.log(`Service ${serviceId}: FLEXIBLE duration - Base ₹${basePrice} (${baseEstimatedTime} mins) → ${currentDuration} mins = ₹${calculatedPrice}`);
      return calculatedPrice;
    }

    // Default to base price for FLEXIBLE services without duration
    console.log(`Service ${serviceId}: FLEXIBLE duration - no duration provided, using base price ₹${basePrice}`);
    return basePrice;
  }

  /**
   * Parse estimated time string to minutes
   * @param estimatedTime - Time string like "30 mins", "60 mins", "2 hours"
   * @returns Duration in minutes
   */
  private parseEstimatedTime(estimatedTime: string | null): number {
    if (!estimatedTime) return 60; // Default to 60 minutes

    const match = estimatedTime.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    if (!match) return 60;

    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();

    if (unit.includes('hr') || unit.includes('hour')) {
      return value * 60; // Convert hours to minutes
    }
    return value; // Already in minutes
  }

  /**
   * Parse duration label to minutes
   * @param durationLabel - Duration label like "30 mins", "60 mins", etc.
   * @returns Duration in minutes
   */
  private parseDurationMinutes(durationLabel: string): number {
    const match = durationLabel.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    if (!match) return 60;

    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();

    if (unit.includes('hr') || unit.includes('hour')) {
      return value * 60; // Convert hours to minutes
    }
    return value; // Already in minutes
  }

  /**
   * Parse duration label to get multiplier
   * Examples: "30 mins" -> 0.5, "60 mins" -> 1.0, "120 mins" -> 2.0
   * @param durationLabel - Duration label like "30 mins", "60 mins", etc.
   * @returns Multiplier for price calculation
   */
  private parseDurationMultiplier(durationLabel: string): number {
    // Try to extract number from the duration label
    const match = durationLabel.match(/(\d+(\.\d+)?)\s*(min|hr|hour|mins|hours|minutes)?/i);
    
    if (!match) {
      console.warn(`Could not parse duration label: ${durationLabel}, using default multiplier 1.0`);
      return 1.0;
    }

    const value = parseFloat(match[1]);
    const unit = (match[3] || '').toLowerCase();

    // Convert to hours if unit is specified
    if (unit.includes('hr') || unit.includes('hour')) {
      return value; // Already in hours
    }
    
    // Convert minutes to hours
    if (unit.includes('min')) {
      return value / 60; // Convert minutes to hours
    }

    // Default: assume minutes
    return value / 60;
  }

  /**
   * Get service base price without duration calculation
   * @param serviceId - ID of the service
   * @returns Base price
   */
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
