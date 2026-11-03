"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

export function useWakeLock(): WakeLockState {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef(false);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "wakeLock" in navigator);
  }, []);

  const release = useCallback(async () => {
    shouldBeActiveRef.current = false;
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn("Error releasing wake lock:", err);
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      setError("Screen Wake Lock API is not supported in this browser.");
      return false;
    }

    shouldBeActiveRef.current = true;
    setError(null);

    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener("release", () => {
        setIsActive(false);
        sentinelRef.current = null;
      });

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to acquire screen wake lock";
      console.warn("Screen wake lock request failed:", message);
      setError(message);
      setIsActive(false);
      return false;
    }
  }, []);

  // Re-acquire wake lock if tab becomes visible again and trip is ongoing
  useEffect(() => {
    if (!isSupported) return;

    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        shouldBeActiveRef.current &&
        !sentinelRef.current
      ) {
        try {
          await request();
        } catch {
          // Handled inside request
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSupported, request]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
  };
}
