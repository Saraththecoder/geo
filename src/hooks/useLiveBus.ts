"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { LiveBusLocation } from "@/types";

const SIGNAL_LOST_THRESHOLD_MS = 30000; // 30 seconds
const FALLBACK_POLL_INTERVAL_MS = 2000; // 2 seconds

export interface UseLiveBusReturn {
  location: LiveBusLocation | null;
  isLoading: boolean;
  isOnTrip: boolean;
  isSignalLost: boolean;
  secondsSinceUpdate: number;
}

export function useLiveBus(busId: string | null | undefined): UseLiveBusReturn {
  const [location, setLocation] = useState<LiveBusLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number>(0);
  const [isSignalLost, setIsSignalLost] = useState<boolean>(false);

  const lastUpdateTsRef = useRef<number>(0);

  // Apply location update safely
  const applyLocationUpdate = useCallback((newLoc: LiveBusLocation | null) => {
    if (newLoc) {
      setLocation(newLoc);
      lastUpdateTsRef.current = newLoc.ts || Date.now();
      setSecondsSinceUpdate(0);
      setIsSignalLost(false);
    } else {
      setLocation(null);
    }
    setIsLoading(false);
  }, []);

  // 1. Direct WebSocket subscription to Firebase RTDB
  useEffect(() => {
    if (!busId) {
      setLocation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let unsubscribe: (() => void) | null = null;

    try {
      const busRef = ref(rtdb, `live/${busId}`);
      unsubscribe = onValue(
        busRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as LiveBusLocation;
            applyLocationUpdate(data);
          } else {
            applyLocationUpdate(null);
          }
        },
        (error) => {
          console.warn("RTDB WebSocket subscription warning (falling back to polling):", error);
        }
      );
    } catch (rtdbErr) {
      console.warn("RTDB ref error (polling active):", rtdbErr);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [busId, applyLocationUpdate]);

  // 2. High-reliability HTTP telemetry polling fallback (every 2s)
  // Ensures real-time data flow even if WebSockets are restricted by CSP, proxy, or rules
  useEffect(() => {
    if (!busId) return;

    async function pollLiveTelemetry() {
      try {
        const res = await fetch(`/api/telemetry/live?busId=${encodeURIComponent(busId!)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            applyLocationUpdate(json.data as LiveBusLocation);
          }
        }
      } catch (pollErr) {
        console.debug("Telemetry polling tick error:", pollErr);
      }
    }

    // Initial poll immediately
    pollLiveTelemetry();

    // Recurring poll
    const pollTimer = setInterval(pollLiveTelemetry, FALLBACK_POLL_INTERVAL_MS);

    // Immediate poll when switching back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pollLiveTelemetry();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [busId, applyLocationUpdate]);

  // 3. Tick timer every second to compute secondsSinceUpdate and detect signal lost (>30s)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastUpdateTsRef.current) return;

      const elapsedMs = Date.now() - lastUpdateTsRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setSecondsSinceUpdate(elapsedSec);

      if (elapsedMs > SIGNAL_LOST_THRESHOLD_MS) {
        setIsSignalLost(true);
      } else {
        setIsSignalLost(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isOnTrip = location?.status === "active";

  return {
    location,
    isLoading,
    isOnTrip,
    isSignalLost,
    secondsSinceUpdate,
  };
}
