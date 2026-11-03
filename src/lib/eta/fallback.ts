import { LatLng, EtaResult, IEtaProvider } from "@/types";
import { calculateHaversineDistance } from "@/lib/geo/distance";

// Default urban bus speed: 25 km/h ≈ 6.94 m/s
export const DEFAULT_AVERAGE_SPEED_MPS = 6.94;

export class FallbackSpeedEtaProvider implements IEtaProvider {
  public name = "fallback_speed";

  async calculateEta(
    origin: LatLng,
    destination: LatLng,
    speedMps?: number
  ): Promise<EtaResult> {
    const distanceMeters = calculateHaversineDistance(origin, destination);

    // If bus is stationary or speed is missing/very low (< 1.5 m/s ≈ 5 km/h),
    // assume urban transit average speed of 25 km/h (6.94 m/s)
    const effectiveSpeed =
      typeof speedMps === "number" && speedMps >= 1.5
        ? speedMps
        : DEFAULT_AVERAGE_SPEED_MPS;

    const durationSeconds = Math.max(15, Math.round(distanceMeters / effectiveSpeed));

    return {
      durationSeconds,
      distanceMeters,
      source: "fallback_speed",
      calculatedAt: Date.now(),
    };
  }
}
