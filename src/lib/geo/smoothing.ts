import { LatLng } from "@/types";

export interface GeoPointWithAccuracy extends LatLng {
  accuracy: number;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export const MAX_ACCEPTED_ACCURACY_METERS = 50;

/**
 * Validates whether a raw geolocation fix meets accuracy requirements.
 */
export function isAccuracyAcceptable(
  accuracy: number,
  thresholdMeters = MAX_ACCEPTED_ACCURACY_METERS
): boolean {
  return Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= thresholdMeters;
}

/**
 * Moving average filter for GPS points to smooth jitter.
 */
export class MovingAverageFilter {
  private windowSize: number;
  private buffer: GeoPointWithAccuracy[] = [];

  constructor(windowSize = 4) {
    this.windowSize = Math.max(1, windowSize);
  }

  /**
   * Adds a new point to the window if it passes the accuracy threshold.
   * Returns the smoothed coordinate or null if filtered out.
   */
  public addPoint(point: GeoPointWithAccuracy): GeoPointWithAccuracy | null {
    if (!isAccuracyAcceptable(point.accuracy)) {
      return null;
    }

    this.buffer.push(point);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    const count = this.buffer.length;
    let sumLat = 0;
    let sumLng = 0;
    let sumSpeed = 0;
    let validSpeedCount = 0;

    for (const p of this.buffer) {
      sumLat += p.lat;
      sumLng += p.lng;
      if (typeof p.speed === "number" && !Number.isNaN(p.speed) && p.speed >= 0) {
        sumSpeed += p.speed;
        validSpeedCount++;
      }
    }

    return {
      lat: Number((sumLat / count).toFixed(7)),
      lng: Number((sumLng / count).toFixed(7)),
      accuracy: point.accuracy,
      speed: validSpeedCount > 0 ? Number((sumSpeed / validSpeedCount).toFixed(2)) : 0,
      heading: point.heading ?? null,
      timestamp: point.timestamp,
    };
  }

  public getHistory(): readonly GeoPointWithAccuracy[] {
    return this.buffer;
  }

  public clear(): void {
    this.buffer = [];
  }
}
