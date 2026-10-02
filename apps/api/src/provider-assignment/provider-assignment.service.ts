import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

const DISTANCE_TIERS = {
  IDEAL: 5,
  GOOD: 10,
  ACCEPTABLE: 15,
  COMPENSATED: 25,
  FAR: 25,
};

@Injectable()
export class ProviderAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getDistanceTier(distance: number): string {
    if (distance <= DISTANCE_TIERS.IDEAL) return 'IDEAL';
    if (distance <= DISTANCE_TIERS.GOOD) return 'GOOD';
    if (distance <= DISTANCE_TIERS.ACCEPTABLE) return 'ACCEPTABLE';
    if (distance <= DISTANCE_TIERS.COMPENSATED) return 'COMPENSATED';
    return 'FAR';
  }

  async findSuitableProviders(
    clientLat: number,
    clientLon: number,
    serviceId: string,
    options: { requireOnline?: boolean } = {}
  ) {
    const { requireOnline = true } = options;

    const providers = await this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        profile: {
          isVerified: true,
          ...(requireOnline ? { isOnline: true } : {}),
          latitude: { not: null },
          longitude: { not: null },
          OR: [
            { professionIds: { array_contains: serviceId } },
            { professionId: serviceId }
          ]
        },
      },
      include: {
        profile: true,
      },
    });

    const providersWithDistance = providers
      .map(provider => {
        const distance = this.calculateDistance(
          clientLat,
          clientLon,
          provider.profile!.latitude!,
          provider.profile!.longitude!
        );
        const tier = this.getDistanceTier(distance);
        return {
          provider,
          distance,
          tier,
        };
      })
      .filter(p => p.tier !== 'FAR')
      .sort((a, b) => a.distance - b.distance);

    return providersWithDistance;
  }

  async assignBestProvider(
    clientLat: number,
    clientLon: number,
    serviceId: string,
    options: { requireOnline?: boolean } = {}
  ): Promise<{ providerId: string | null; totalPrice: number; travelCompensation?: number }> {
    const { requireOnline = true } = options;
    
    const suitableProviders = await this.findSuitableProviders(
      clientLat,
      clientLon,
      serviceId,
      { requireOnline }
    );

    if (suitableProviders.length === 0) {
      return { providerId: null, totalPrice: 0 };
    }

    // Priority: IDEAL > GOOD > ACCEPTABLE > COMPENSATED
    const idealProvider = suitableProviders.find(p => p.tier === 'IDEAL');
    if (idealProvider) {
      return { providerId: idealProvider.provider.id, totalPrice: 0 };
    }

    const goodProvider = suitableProviders.find(p => p.tier === 'GOOD');
    if (goodProvider) {
      return { providerId: goodProvider.provider.id, totalPrice: 0 };
    }

    const acceptableProvider = suitableProviders.find(p => p.tier === 'ACCEPTABLE');
    if (acceptableProvider) {
      return { providerId: acceptableProvider.provider.id, totalPrice: 0 };
    }

    const compensatedProvider = suitableProviders.find(p => p.tier === 'COMPENSATED');
    if (compensatedProvider) {
      const travelCompensation = 150;
      return { 
        providerId: compensatedProvider.provider.id, 
        totalPrice: travelCompensation,
        travelCompensation 
      };
    }

    return { providerId: null, totalPrice: 0 };
  }
}
