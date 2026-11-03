/**
 * Domain entity types for College Bus Tracker
 */

export type UserRole = "student" | "driver" | "admin";

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  allocatedBusId?: string | null;
  stopId?: string | null;
  fcmTokens?: string[];
  createdAt?: number;
  updatedAt?: number;
}

export type BusTripStatus = "active" | "ended";

export interface LiveBusLocation {
  lat: number;
  lng: number;
  speed: number; // in meters/sec or km/h (standardized to m/s)
  heading: number; // 0-360 degrees
  accuracy: number; // in meters
  ts: number; // epoch ms
  tripId: string;
  driverUid: string;
  status: BusTripStatus;
}

export interface Bus {
  id: string;
  number: string;
  plate: string;
  capacity: number;
  routeId: string;
  driverUid?: string | null;
  isActive?: boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  name: string;
  stopIds: string[]; // ordered array of Stop IDs
  polyline: [number, number][]; // [lat, lng] coordinates
  isActive?: boolean;
}

export interface StopLogEntry {
  stopId: string;
  reachedAt: number;
  scheduledAt?: number;
}

export interface Trip {
  id: string;
  busId: string;
  driverUid: string;
  routeId: string;
  startedAt: number;
  endedAt?: number | null;
  delayMinutes: number;
  stopsLog: StopLogEntry[];
  status: BusTripStatus;
}

/**
 * ETA calculation types
 */
export interface EtaRequest {
  busId: string;
  currentLat: number;
  currentLng: number;
  stopId: string;
  speed?: number; // current speed
}

export interface EtaResult {
  durationSeconds: number; // estimated time in seconds
  distanceMeters: number; // road or haversine distance
  source: "osrm" | "fallback_speed";
  calculatedAt: number;
}

export interface IEtaProvider {
  name: string;
  calculateEta(
    origin: LatLng,
    destination: LatLng,
    speedMps?: number
  ): Promise<EtaResult>;
}

/**
 * Standard API Response Shape
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
