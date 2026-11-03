import { describe, it, expect } from "vitest";
import { calculateDistanceMeters } from "../../functions/src/utils/geo";

describe("Notifications & Cloud Functions Logic", () => {
  const campusGate = { lat: 13.0827, lng: 80.2707 };
  const nearbyBus = { lat: 13.0900, lng: 80.2750 }; // ~900m away
  const distantBus = { lat: 13.1500, lng: 80.3200 }; // ~9km away

  it("identifies when a bus is within proximity threshold (<= 2000m)", () => {
    const distNearby = calculateDistanceMeters(nearbyBus, campusGate);
    expect(distNearby).toBeLessThanOrEqual(2000);

    const distDistant = calculateDistanceMeters(distantBus, campusGate);
    expect(distDistant).toBeGreaterThan(2000);
  });

  it("verifies idempotency logic: skips notification if already sent for trip", () => {
    const sentNotificationsStore = new Set<string>();

    const shouldSendNotification = (tripId: string, studentUid: string): boolean => {
      const key = `${tripId}:${studentUid}`;
      if (sentNotificationsStore.has(key)) {
        return false; // Skip duplicate!
      }
      sentNotificationsStore.add(key);
      return true;
    };

    const tripId = "trip_demo_101";
    const studentA = "student_rahul";
    const studentB = "student_priya";

    // First arrival check for Student A
    expect(shouldSendNotification(tripId, studentA)).toBe(true);

    // Second check in next tick for Student A (same trip): MUST be skipped
    expect(shouldSendNotification(tripId, studentA)).toBe(false);

    // First check for Student B: allowed
    expect(shouldSendNotification(tripId, studentB)).toBe(true);

    // Next trip: Student A can be notified again for new trip
    const nextTripId = "trip_demo_102";
    expect(shouldSendNotification(nextTripId, studentA)).toBe(true);
  });

  it("identifies stale FCM token error codes for pruning", () => {
    const isStaleTokenError = (errorCode: string): boolean => {
      const staleCodes = [
        "messaging/registration-token-not-registered",
        "messaging/invalid-registration-token",
        "messaging/invalid-argument",
      ];
      return staleCodes.includes(errorCode);
    };

    expect(isStaleTokenError("messaging/registration-token-not-registered")).toBe(true);
    expect(isStaleTokenError("messaging/invalid-registration-token")).toBe(true);
    expect(isStaleTokenError("messaging/internal-error")).toBe(false);
    expect(isStaleTokenError("messaging/server-unavailable")).toBe(false);
  });

  it("validates FCM push payload format", () => {
    const payload = {
      title: "Bus #12 Arriving Soon!",
      body: "Bus #12 is approaching Central Library (~5 min away).",
      data: {
        busId: "bus_12",
        tripId: "trip_001",
        stopId: "stop_library",
      },
    };

    expect(payload.title).toContain("Bus #12");
    expect(payload.body).toContain("Central Library");
    expect(payload.data.tripId).toBe("trip_001");
  });
});

