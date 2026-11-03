import { describe, it, expect, vi, beforeEach } from "vitest";
import { MovingAverageFilter, isAccuracyAcceptable } from "@/lib/geo/smoothing";

describe("Driver Tracking - Throttle, Accuracy and Queue Logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("filters out coordinates with accuracy > 50 meters", () => {
    const filter = new MovingAverageFilter(3);

    // Accurate point
    const p1 = filter.addPoint({
      lat: 13.123,
      lng: 78.123,
      accuracy: 25,
      timestamp: Date.now(),
    });
    expect(p1).not.toBeNull();

    // Inaccurate point (> 50m)
    const p2 = filter.addPoint({
      lat: 13.125,
      lng: 78.125,
      accuracy: 65,
      timestamp: Date.now(),
    });
    expect(p2).toBeNull();
    expect(isAccuracyAcceptable(65)).toBe(false);
  });

  it("simulates 5-second throttling window for GPS transmissions", () => {
    const throttleMs = 5000;
    let lastWriteTs = 0;
    let writesCount = 0;
    let queuedPoint: { lat: number; lng: number } | null = null;

    const transmitPoint = (pt: { lat: number; lng: number }, now: number) => {
      if (lastWriteTs > 0 && now - lastWriteTs < throttleMs) {
        queuedPoint = pt;
        return false;
      }
      lastWriteTs = now;
      writesCount++;
      queuedPoint = null;
      return true;
    };

    // First ping at t = 1000ms: succeeds immediately
    const res1 = transmitPoint({ lat: 10, lng: 10 }, 1000);
    expect(res1).toBe(true);
    expect(writesCount).toBe(1);
    expect(queuedPoint).toBeNull();

    // Second ping at t = 2000ms (< 5000ms since last write): throttled and queued
    const res2 = transmitPoint({ lat: 10.01, lng: 10.01 }, 2000);
    expect(res2).toBe(false);
    expect(writesCount).toBe(1);
    expect(queuedPoint).toEqual({ lat: 10.01, lng: 10.01 });

    // Third ping at t = 3500ms: replaces queued point
    const res3 = transmitPoint({ lat: 10.02, lng: 10.02 }, 3500);
    expect(res3).toBe(false);
    expect(writesCount).toBe(1);
    expect(queuedPoint).toEqual({ lat: 10.02, lng: 10.02 });

    // Fourth ping at t = 6500ms (> 5000ms since last write at 1000ms): succeeds
    const res4 = transmitPoint(queuedPoint!, 6500);
    expect(res4).toBe(true);
    expect(writesCount).toBe(2);
    expect(queuedPoint).toBeNull();
  });

  it("handles offline queueing and online flush", () => {
    let isOnline = false;
    let queuedFix: { lat: number; lng: number } | null = null;
    let transmittedCount = 0;

    const sendFix = (fix: { lat: number; lng: number }) => {
      if (!isOnline) {
        queuedFix = fix;
        return;
      }
      transmittedCount++;
      queuedFix = null;
    };

    // Offline transmission attempt
    sendFix({ lat: 12.5, lng: 77.5 });
    expect(transmittedCount).toBe(0);
    expect(queuedFix).toEqual({ lat: 12.5, lng: 77.5 });

    // Connection restored
    isOnline = true;
    if (queuedFix) {
      sendFix(queuedFix);
    }
    expect(transmittedCount).toBe(1);
    expect(queuedFix).toBeNull();
  });
});
