import { LatLng, EtaResult, IEtaProvider } from "@/types";
import { OsrmEtaProvider } from "@/lib/eta/osrm";
import { FallbackSpeedEtaProvider } from "@/lib/eta/fallback";

interface CacheEntry {
  result: EtaResult;
  expiresAt: number;
}

export class EtaService {
  private primaryProvider: IEtaProvider;
  private fallbackProvider: IEtaProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtlMs: number;

  constructor(
    primaryProvider: IEtaProvider = new OsrmEtaProvider(),
    fallbackProvider: IEtaProvider = new FallbackSpeedEtaProvider(),
    cacheTtlMs = 20000 // 20 seconds TTL
  ) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
    this.cacheTtlMs = cacheTtlMs;
  }

  private getCacheKey(origin: LatLng, destination: LatLng): string {
    // Round to 4 decimal places (~11 meters) to allow cache hits for nearby pings
    return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  }

  async getEta(
    origin: LatLng,
    destination: LatLng,
    speedMps?: number
  ): Promise<EtaResult> {
    const key = this.getCacheKey(origin, destination);
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.result;
    }

    let result: EtaResult;

    try {
      // 1. Attempt primary provider (OSRM road ETA)
      result = await this.primaryProvider.calculateEta(origin, destination, speedMps);
    } catch (err) {
      // 2. Primary failed or timed out: fall back seamlessly to speed-based estimate
      console.warn("Primary ETA provider failed, using fallback:", err);
      result = await this.fallbackProvider.calculateEta(origin, destination, speedMps);
    }

    // Cache the result
    this.cache.set(key, {
      result,
      expiresAt: now + this.cacheTtlMs,
    });

    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// Global singleton instance for server API usage
export const etaService = new EtaService();
