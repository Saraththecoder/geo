"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LiveBusLocation } from "@/types";
import { MovingAverageFilter } from "@/lib/geo/smoothing";
import { ref, set } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export interface TrackerOptions {
  throttleMs?: number; // Minimum ms between RTDB writes (default 5000)
  maxAccuracyMeters?: number; // Reject fixes worse than this (default 50)
  windowSize?: number; // Moving average window size (default 3)
}

export interface GeolocationState {
  isTracking: boolean;
  isOnline: boolean;
  currentPosition: LiveBusLocation | null;
  pingsSent: number;
  droppedPings: number;
  queuedCount: number;
  error: string | null;
  errorCode: number | null; // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
}

export function useGeolocationTracker(options: TrackerOptions = {}) {
  const throttleMs = options.throttleMs ?? 3000;
  const maxAccuracy = options.maxAccuracyMeters ?? 2000;
  const windowSize = options.windowSize ?? 3;

  const [state, setState] = useState<GeolocationState>({
    isTracking: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    currentPosition: null,
    pingsSent: 0,
    droppedPings: 0,
    queuedCount: 0,
    error: null,
    errorCode: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const filterRef = useRef<MovingAverageFilter>(new MovingAverageFilter(windowSize));
  const lastWriteTsRef = useRef<number>(0);
  const queuedPingRef = useRef<LiveBusLocation | null>(null);
  const activeTripRef = useRef<{
    tripId: string;
    busId: string;
    driverUid: string;
  } | null>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      // Flush queued ping if exists
      if (queuedPingRef.current && activeTripRef.current) {
        flushQueuedPing(activeTripRef.current.busId, queuedPingRef.current);
      }
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const flushQueuedPing = async (busId: string, location: LiveBusLocation) => {
    try {
      const busLocationRef = ref(rtdb, `live/${busId}`);
      await set(busLocationRef, location);
      queuedPingRef.current = null;
      setState((prev) => ({
        ...prev,
        pingsSent: prev.pingsSent + 1,
        queuedCount: 0,
      }));
    } catch (err) {
      console.warn("Failed to flush queued GPS ping:", err);
    }
  };

  const transmitLocation = async (busId: string, location: LiveBusLocation) => {
    const now = Date.now();
    // Enforce throttling interval
    if (now - lastWriteTsRef.current < throttleMs) {
      // Store as the latest queued point to be sent on next tick if disconnected
      queuedPingRef.current = location;
      return;
    }

    if (!navigator.onLine) {
      // Offline: queue last point
      queuedPingRef.current = location;
      setState((prev) => ({ ...prev, queuedCount: 1 }));
      return;
    }

    try {
      const busLocationRef = ref(rtdb, `live/${busId}`);
      await set(busLocationRef, location);
      lastWriteTsRef.current = now;
      queuedPingRef.current = null;

      setState((prev) => ({
        ...prev,
        pingsSent: prev.pingsSent + 1,
        queuedCount: 0,
      }));
    } catch (err: unknown) {
      console.warn("RTDB write warning, attempting API fallback:", err);
      try {
        const res = await fetch("/api/telemetry/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ busId, location }),
        });
        if (res.ok) {
          lastWriteTsRef.current = now;
          queuedPingRef.current = null;
          setState((prev) => ({
            ...prev,
            pingsSent: prev.pingsSent + 1,
            queuedCount: 0,
          }));
          return;
        }
      } catch (fallbackErr) {
        console.warn("Telemetry fallback also failed:", fallbackErr);
      }
      queuedPingRef.current = location;
      setState((prev) => ({
        ...prev,
        queuedCount: 1,
      }));
    }
  };

  const handlePositionSuccess = (position: GeolocationPosition) => {
    const coords = position.coords;
    const rawAccuracy = coords.accuracy;

    // Drop only points with accuracy worse than maxAccuracy (2000m)
    if (rawAccuracy > maxAccuracy) {
      setState((prev) => ({
        ...prev,
        droppedPings: prev.droppedPings + 1,
      }));
      return;
    }

    // Pass through moving average filter
    const smoothed = filterRef.current.addPoint({
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: rawAccuracy,
      speed: coords.speed ?? 0,
      heading: coords.heading ?? 0,
      timestamp: position.timestamp,
    });

    if (!smoothed || !activeTripRef.current) return;

    const payload: LiveBusLocation = {
      lat: smoothed.lat,
      lng: smoothed.lng,
      speed: smoothed.speed ?? 0,
      heading: coords.heading && !Number.isNaN(coords.heading) ? coords.heading : 0,
      accuracy: Math.round(smoothed.accuracy),
      ts: Date.now(),
      tripId: activeTripRef.current.tripId,
      driverUid: activeTripRef.current.driverUid,
      status: "active",
    };

    setState((prev) => ({
      ...prev,
      currentPosition: payload,
      error: null,
      errorCode: null,
    }));

    transmitLocation(activeTripRef.current.busId, payload);
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    let message = "Unknown geolocation error";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Location permission denied. Please enable GPS permissions in browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        message =
          "GPS signal lost or location information unavailable. Move to an open area.";
        break;
      case error.TIMEOUT:
        message = "GPS request timed out waiting for location fix.";
        break;
    }

    setState((prev) => ({
      ...prev,
      error: message,
      errorCode: error.code,
    }));
  };

  const successHandlerRef = useRef(handlePositionSuccess);
  successHandlerRef.current = handlePositionSuccess;

  const errorHandlerRef = useRef(handlePositionError);
  errorHandlerRef.current = handlePositionError;

  const startTracking = useCallback(
    (tripId: string, busId: string, driverUid: string): boolean => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        setState((prev) => ({
          ...prev,
          error: "Geolocation API is not supported by your browser.",
        }));
        return false;
      }

      activeTripRef.current = { tripId, busId, driverUid };
      filterRef.current.clear();
      lastWriteTsRef.current = 0;
      queuedPingRef.current = null;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => successHandlerRef.current(pos),
        (err) => errorHandlerRef.current(err),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      watchIdRef.current = watchId;
      setState((prev) => ({
        ...prev,
        isTracking: true,
        error: null,
        errorCode: null,
      }));

      return true;
    },
    []
  );

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // If an active trip was running, mark status ended in RTDB
    if (activeTripRef.current && state.currentPosition) {
      const endedPayload: LiveBusLocation = {
        ...state.currentPosition,
        status: "ended",
        ts: Date.now(),
      };
      try {
        const busLocationRef = ref(rtdb, `live/${activeTripRef.current.busId}`);
        await set(busLocationRef, endedPayload);
      } catch (err) {
        console.warn("Failed to set ended status in RTDB:", err);
      }
    }

    activeTripRef.current = null;
    filterRef.current.clear();
    queuedPingRef.current = null;

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, [state.currentPosition]);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const transmitRef = useRef(transmitLocation);
  transmitRef.current = transmitLocation;

  const manualUpdate = useCallback(
    async (lat: number, lng: number, speed: number = 30, heading: number = 90) => {
      if (!activeTripRef.current) return;
      const payload: LiveBusLocation = {
        lat,
        lng,
        speed,
        heading,
        accuracy: 5,
        ts: Date.now(),
        tripId: activeTripRef.current.tripId,
        driverUid: activeTripRef.current.driverUid,
        status: "active",
      };
      setState((prev) => ({
        ...prev,
        currentPosition: payload,
        error: null,
      }));
      await transmitRef.current(activeTripRef.current.busId, payload);
    },
    []
  );

  return {
    ...state,
    startTracking,
    stopTracking,
    manualUpdate,
  };
}
