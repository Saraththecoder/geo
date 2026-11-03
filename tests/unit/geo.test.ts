import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateHaversineDistance,
  calculateBearing,
} from "@/lib/geo/distance";
import {
  MovingAverageFilter,
  isAccuracyAcceptable,
  MAX_ACCEPTED_ACCURACY_METERS,
} from "@/lib/geo/smoothing";

describe("Geo Utilities - Distance & Bearing", () => {
  // Test coordinates: Hyderabad to Bangalore (approx 500km)
  const hyd = { lat: 17.385, lng: 78.4867 };
  const blr = { lat: 12.9716, lng: 77.5946 };

  it("calculates haversine distance between two points accurately", () => {
    const dist = calculateHaversineDistance(hyd, blr);
    // Approximate distance is ~500 km (within 10km margin)
    expect(dist).toBeGreaterThan(490000);
    expect(dist).toBeLessThan(510000);
  });

  it("returns 0 distance for identical coordinates", () => {
    const dist = calculateHaversineDistance(hyd, hyd);
    expect(dist).toBe(0);
  });

  it("calculates initial bearing from point A to point B", () => {
    const bearing = calculateBearing(hyd, blr);
    // Heading south-southwest: between 180 and 200 degrees
    expect(bearing).toBeGreaterThanOrEqual(180);
    expect(bearing).toBeLessThanOrEqual(200);
  });
});

describe("Geo Utilities - Moving Average & Accuracy Filter", () => {
  let filter: MovingAverageFilter;

  beforeEach(() => {
    filter = new MovingAverageFilter(3);
  });

  it("accepts points with accuracy within threshold", () => {
    expect(isAccuracyAcceptable(10)).toBe(true);
    expect(isAccuracyAcceptable(MAX_ACCEPTED_ACCURACY_METERS)).toBe(true);
  });

  it("rejects points with accuracy over threshold or invalid values", () => {
    expect(isAccuracyAcceptable(MAX_ACCEPTED_ACCURACY_METERS + 1)).toBe(false);
    expect(isAccuracyAcceptable(150)).toBe(false);
    expect(isAccuracyAcceptable(-5)).toBe(false);
    expect(isAccuracyAcceptable(NaN)).toBe(false);
  });

  it("drops points with accuracy > 50m in filter", () => {
    const dropped = filter.addPoint({
      lat: 13.0,
      lng: 77.0,
      accuracy: 65,
      timestamp: 1000,
    });
    expect(dropped).toBeNull();
    expect(filter.getHistory().length).toBe(0);
  });

  it("smooths consecutive points using moving average window", () => {
    // Add point 1
    const p1 = filter.addPoint({
      lat: 10.0,
      lng: 20.0,
      accuracy: 10,
      speed: 10,
      timestamp: 1000,
    });
    expect(p1?.lat).toBe(10.0);
    expect(p1?.lng).toBe(20.0);
    expect(p1?.speed).toBe(10);

    // Add point 2
    const p2 = filter.addPoint({
      lat: 10.2,
      lng: 20.2,
      accuracy: 15,
      speed: 20,
      timestamp: 2000,
    });
    expect(p2?.lat).toBe(10.1);
    expect(p2?.lng).toBe(20.1);
    expect(p2?.speed).toBe(15);

    // Add point 3
    const p3 = filter.addPoint({
      lat: 10.4,
      lng: 20.4,
      accuracy: 12,
      speed: 30,
      timestamp: 3000,
    });
    expect(p3?.lat).toBe(10.2);
    expect(p3?.lng).toBe(20.2);
    expect(p3?.speed).toBe(20);
  });
});
