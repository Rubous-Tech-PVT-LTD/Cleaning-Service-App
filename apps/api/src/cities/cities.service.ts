import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckLocationDto } from './dto/check-location.dto';

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function cityNameMatches(input: string, candidates: string[]): boolean {
  const normalizedInput = normalize(input);
  if (!normalizedInput) return false;

  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return (
      normalizedInput === normalizedCandidate ||
      normalizedInput.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedInput)
    );
  });
}

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supportedCity.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        aliases: true,
        latitude: true,
        longitude: true,
        radiusKm: true,
      },
    });
  }

  async checkLocation(dto: CheckLocationDto) {
    const cities = await this.findAll();

    if (dto.city) {
      for (const city of cities) {
        const names = [city.name, ...city.aliases];
        if (cityNameMatches(dto.city, names)) {
          return { isSupported: true, matchedCity: city };
        }
      }
    }

    if (dto.lat != null && dto.lng != null) {
      let closest: { city: (typeof cities)[number]; distance: number } | null =
        null;

      for (const city of cities) {
        const distance = haversineKm(
          dto.lat,
          dto.lng,
          city.latitude,
          city.longitude,
        );
        if (distance <= city.radiusKm) {
          return { isSupported: true, matchedCity: city };
        }
        if (!closest || distance < closest.distance) {
          closest = { city, distance };
        }
      }
    }

    return { isSupported: false, matchedCity: null };
  }
}
