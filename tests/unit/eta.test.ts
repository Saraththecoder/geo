import { describe, it, expect, vi } from "vitest";
import { FallbackSpeedEtaProvider } from "@/lib/eta/fallback";
import { OsrmEtaProvider } from "@/lib/eta/osrm";
import { EtaService } from "@/lib/eta/service";
import { IEtaProvider, LatLng } from "@/types";

describe("ETA Calculations & Providers", () => {
  const origin: LatLng = { lat: 13.0827, lng: 80.2707 };
  const destination: LatLng = { lat: 13.0878, lng: 80.2785 }; // ~1 km away

  describe("FallbackSpeedEtaProvider", () => {
    const provider = new FallbackSpeedEtaProvider();

    it("calculates duration using provided vehicle speed", async () => {
      const speedMps = 10; // 10 m/s = 36 km/h
      const result = await provider.calculateEta(origin, destination, speedMps);

      expect(result.source).toBe("fallback_speed");
      expect(result.distanceMeters).toBeGreaterThan(900);
      expect(result.distanceMeters).toBeLessThan(1200);
      // duration ≈ distance / speed
      expect(result.durationSeconds).toBe(Math.round(result.distanceMeters / speedMps));
    });

    it("falls back to default transit average speed (25 km/h) if stationary", async () => {
      const result = await provider.calculateEta(origin, destination, 0);

      expect(result.source).toBe("fallback_speed");
      // Default speed is 6.94 m/s
      expect(result.durationSeconds).toBe(Math.round(result.distanceMeters / 6.94));
    });
  });

  describe("OsrmEtaProvider", () => {
    it("calls OSRM endpoint with correct lng,lat ordering and parses response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [
            {
              duration: 320,
              distance: 1450,
            },
          ],
        }),
      });
      global.fetch = mockFetch;

      const provider = new OsrmEtaProvider("https://router.project-osrm.org");
      const result = await provider.calculateEta(origin, destination);

      expect(result.source).toBe("osrm");
      expect(result.durationSeconds).toBe(320);
      expect(result.distanceMeters).toBe(1450);

      // Verify coordinate query format: lng,lat;lng,lat
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${origin.lng},${origin.lat};${destination.lng},${destination.lat}`),
        expect.any(Object)
      );
    });

    it("throws an error when OSRM API returns an error status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const provider = new OsrmEtaProvider();
      await expect(provider.calculateEta(origin, destination)).rejects.toThrow("OSRM responded with HTTP 503");
    });
  });

  describe("EtaService with Fallback & Caching", () => {
    it("uses primary provider when available and caches the result", async () => {
      const primaryMock: IEtaProvider = {
        name: "primary",
        calculateEta: vi.fn().mockResolvedValue({
          durationSeconds: 180,
          distanceMeters: 800,
          source: "osrm" as const,
          calculatedAt: Date.now(),
        }),
      };

      const fallbackMock: IEtaProvider = {
        name: "fallback",
        calculateEta: vi.fn(),
      };

      const service = new EtaService(primaryMock, fallbackMock, 10000);

      // Call 1: should call primary
      const res1 = await service.getEta(origin, destination);
      expect(res1.durationSeconds).toBe(180);
      expect(primaryMock.calculateEta).toHaveBeenCalledTimes(1);
      expect(fallbackMock.calculateEta).not.toHaveBeenCalled();

      // Call 2: should hit in-memory cache without calling primary again
      const res2 = await service.getEta(origin, destination);
      expect(res2.durationSeconds).toBe(180);
      expect(primaryMock.calculateEta).toHaveBeenCalledTimes(1);
    });

    it("seamlessly delegates to fallback provider if primary provider fails", async () => {
      const primaryFailingMock: IEtaProvider = {
        name: "primary",
        calculateEta: vi.fn().mockRejectedValue(new Error("Network timeout")),
      };

      const fallbackMock: IEtaProvider = {
        name: "fallback",
        calculateEta: vi.fn().mockResolvedValue({
          durationSeconds: 240,
          distanceMeters: 900,
          source: "fallback_speed" as const,
          calculatedAt: Date.now(),
        }),
      };

      const service = new EtaService(primaryFailingMock, fallbackMock);
      const res = await service.getEta(origin, destination);

      expect(res.durationSeconds).toBe(240);
      expect(res.source).toBe("fallback_speed");
      expect(primaryFailingMock.calculateEta).toHaveBeenCalledTimes(1);
      expect(fallbackMock.calculateEta).toHaveBeenCalledTimes(1);
    });
  });
});
