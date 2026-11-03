import { z } from "zod";

export const userRoleSchema = z.enum(["student", "driver", "admin"]);

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  role: userRoleSchema,
  name: z.string().min(1),
  email: z.string().email(),
  allocatedBusId: z.string().nullable().optional(),
  stopId: z.string().nullable().optional(),
  fcmTokens: z.array(z.string()).default([]),
  createdAt: z.number().int().positive().optional(),
  updatedAt: z.number().int().positive().optional(),
});

export const liveBusLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0),
  heading: z.number().min(0).max(360),
  accuracy: z.number().min(0),
  ts: z.number().int().positive(),
  tripId: z.string().min(1),
  driverUid: z.string().min(1),
  status: z.enum(["active", "ended"]),
});

export const stopSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Stop name is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const routeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Route name is required"),
  stopIds: z.array(z.string()).min(1, "Route must have at least one stop"),
  polyline: z.array(z.tuple([z.number(), z.number()])).default([]),
  isActive: z.boolean().default(true),
});

export const busSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1, "Bus number is required"),
  plate: z.string().min(1, "License plate is required"),
  capacity: z.number().int().positive("Capacity must be positive"),
  routeId: z.string().min(1, "Assigned route is required"),
  driverUid: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const stopLogEntrySchema = z.object({
  stopId: z.string().min(1),
  reachedAt: z.number().int().positive(),
  scheduledAt: z.number().int().positive().optional(),
});

export const tripSchema = z.object({
  id: z.string().min(1),
  busId: z.string().min(1),
  driverUid: z.string().min(1),
  routeId: z.string().min(1),
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().nullable().optional(),
  delayMinutes: z.number().int().default(0),
  stopsLog: z.array(stopLogEntrySchema).default([]),
  status: z.enum(["active", "ended"]),
});

export const etaRequestSchema = z.object({
  busId: z.string().min(1),
  currentLat: z.number().min(-90).max(90),
  currentLng: z.number().min(-180).max(180),
  stopId: z.string().min(1),
  speed: z.number().min(0).optional(),
});

export const studentCsvRowSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Student name is required"),
  busNumber: z.string().min(1, "Bus number is required"),
  stopName: z.string().min(1, "Stop name is required"),
});
