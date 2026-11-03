import { describe, it, expect } from "vitest";
import { busSchema, routeSchema, stopSchema } from "@/lib/validation/schemas";

describe("Admin - Entity Validation Schemas", () => {
  describe("busSchema", () => {
    it("accepts valid bus data", () => {
      const validBus = {
        id: "bus_1",
        number: "12",
        plate: "AP 04 TX 1234",
        capacity: 45,
        routeId: "route_1",
        driverUid: "driver_abc",
        isActive: true,
      };
      expect(busSchema.safeParse(validBus).success).toBe(true);
    });

    it("rejects non-positive capacity or missing plate", () => {
      const invalidBus = {
        id: "bus_2",
        number: "14",
        plate: "",
        capacity: -5,
        routeId: "route_1",
      };
      const res = busSchema.safeParse(invalidBus);
      expect(res.success).toBe(false);
    });
  });

  describe("stopSchema", () => {
    it("accepts valid coordinate bounds", () => {
      const validStop = {
        id: "stop_1",
        name: "Campus Gate",
        lat: 13.0827,
        lng: 80.2707,
      };
      expect(stopSchema.safeParse(validStop).success).toBe(true);
    });

    it("rejects out-of-range coordinates", () => {
      const invalidStop = {
        id: "stop_2",
        name: "Faulty Stop",
        lat: 95.0, // Invalid lat (> 90)
        lng: 80.0,
      };
      expect(stopSchema.safeParse(invalidStop).success).toBe(false);
    });
  });

  describe("routeSchema", () => {
    it("accepts valid route with stops", () => {
      const validRoute = {
        id: "route_1",
        name: "North Campus Express",
        stopIds: ["stop_1", "stop_2"],
        polyline: [
          [13.08, 80.27],
          [13.09, 80.28],
        ],
        isActive: true,
      };
      expect(routeSchema.safeParse(validRoute).success).toBe(true);
    });

    it("rejects route without any stops", () => {
      const emptyRoute = {
        id: "route_2",
        name: "Empty Route",
        stopIds: [], // Empty stops array
        polyline: [],
      };
      expect(routeSchema.safeParse(emptyRoute).success).toBe(false);
    });
  });
});
