import { LatLng, EtaResult, IEtaProvider } from "@/types";

export class OsrmEtaProvider implements IEtaProvider {
  public name = "osrm";
  private baseUrl: string;
  private timeoutMs: number;

  constructor(
    baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org",
    timeoutMs = 3000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  async calculateEta(origin: LatLng, destination: LatLng): Promise<EtaResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // OSRM requires {longitude},{latitude};{longitude},{latitude} format
      const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      const url = `${this.baseUrl}/route/v1/driving/${coordinates}?overview=false`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`OSRM responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      const firstRoute = data?.routes?.[0];

      if (!firstRoute || typeof firstRoute.duration !== "number") {
        throw new Error("No valid route returned by OSRM");
      }

      return {
        durationSeconds: Math.round(firstRoute.duration),
        distanceMeters: Math.round(firstRoute.distance),
        source: "osrm",
        calculatedAt: Date.now(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
