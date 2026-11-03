import { describe, it, expect } from "vitest";
import { tripSchema, stopLogEntrySchema } from "@/lib/validation/schemas";

describe("Trip Lifecycle & Data Validation", () => {
  it("validates a complete active trip payload", () => {
    const validActiveTrip = {
      id: "trip-001",
      busId: "bus-101",
      driverUid: "driver-xyz",
      routeId: "route-campus-north",
      startedAt: Date.now(),
      status: "active",
      delayMinutes: 0,
      stopsLog: [],
    };

    const result = tripSchema.safeParse(validActiveTrip);
    expect(result.success).toBe(true);
  });

  it("validates a completed trip with stops log and delay", () => {
    const completedTrip = {
      id: "trip-002",
      busId: "bus-102",
      driverUid: "driver-xyz",
      routeId: "route-campus-south",
      startedAt: 1700000000000,
      endedAt: 1700003600000,
      status: "ended",
      delayMinutes: 12,
      stopsLog: [
        {
          stopId: "stop-hostel",
          reachedAt: 1700001000000,
          scheduledAt: 1700000900000,
        },
        {
          stopId: "stop-library",
          reachedAt: 1700002500000,
        },
      ],
    };

    const result = tripSchema.safeParse(completedTrip);
    expect(result.success).toBe(true);
  });

  it("rejects invalid trip status or negative delay values", () => {
    const invalidTrip = {
      id: "trip-003",
      busId: "bus-103",
      driverUid: "driver-xyz",
      routeId: "route-campus-south",
      startedAt: Date.now(),
      status: "in-progress", // Invalid status (must be active or ended)
      delayMinutes: 0,
      stopsLog: [],
    };

    const result = tripSchema.safeParse(invalidTrip);
    expect(result.success).toBe(false);
  });

  it("validates stop log entries correctly", () => {
    const validStopLog = {
      stopId: "stop-1",
      reachedAt: Date.now(),
      scheduledAt: Date.now() - 60000,
    };
    expect(stopLogEntrySchema.safeParse(validStopLog).success).toBe(true);

    const invalidStopLog = {
      stopId: "",
      reachedAt: -100, // Negative timestamp
    };
    expect(stopLogEntrySchema.safeParse(invalidStopLog).success).toBe(false);
  });
});
