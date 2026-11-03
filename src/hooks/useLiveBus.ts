"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { LiveBusLocation } from "@/types";

const SIGNAL_LOST_THRESHOLD_MS = 30000; // 30 seconds

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

  useEffect(() => {
    if (!busId) {
      setLocation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const busRef = ref(rtdb, `live/${busId}`);

    const unsubscribe = onValue(
      busRef,
      (snapshot) => {
        setIsLoading(false);
        if (snapshot.exists()) {
          const data = snapshot.val() as LiveBusLocation;
          setLocation(data);
          lastUpdateTsRef.current = data.ts || Date.now();
          setSecondsSinceUpdate(0);
          setIsSignalLost(false);
        } else {
          setLocation(null);
        }
      },
      (error) => {
        console.warn("RTDB live bus subscription error:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [busId]);

  // Tick timer every second to compute secondsSinceUpdate and detect signal lost (>30s)
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
