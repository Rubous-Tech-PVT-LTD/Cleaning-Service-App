export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    suburb?: string;
    county?: string;
  };
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export async function searchPlaces(
  query: string,
  limit = 5,
): Promise<NominatimResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    countrycodes: 'in',
    limit: String(limit),
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HouceeCleaningApp/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Location search failed');
  }

  return response.json();
}

export function extractCityFromNominatim(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) return '';
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.county ||
    ''
  );
}
