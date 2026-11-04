"use client";

import { useState, useEffect, useRef } from "react";
import { Bus, BusRoute, Trip } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useGeolocationTracker } from "@/hooks/useGeolocationTracker";
import { WakeLockWarning } from "@/features/tracking/WakeLockWarning";
import { GpsStatusCard } from "@/features/tracking/GpsStatusCard";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export function DriverHUD() {
  const { user } = useAuth();
  const wakeLock = useWakeLock();
  const tracker = useGeolocationTracker({ throttleMs: 5000, maxAccuracyMeters: 50 });

  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Record<string, BusRoute>>({});
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simIndexRef = useRef<number>(0);

  // Load buses and routes assigned to driver or all buses
  useEffect(() => {
    async function loadDriverData() {
      if (!user) return;
      try {
        setLoading(true);

        // Fetch buses
        const busQuery = query(collection(db, "buses"), where("isActive", "==", true));
        const busSnapshot = await getDocs(busQuery);
        const busList = busSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Bus[];

        setBuses(busList);
        if (busList.length > 0 && busList[0]) {
          setSelectedBusId(busList[0].id);
        }

        // Fetch routes
        const routeSnapshot = await getDocs(collection(db, "routes"));
        const routeMap: Record<string, BusRoute> = {};
        routeSnapshot.docs.forEach((doc) => {
          routeMap[doc.id] = { id: doc.id, ...doc.data() } as BusRoute;
        });
        setRoutes(routeMap);

        // Check for existing active trip
        const idToken = await user.getIdToken();
        const tripRes = await fetch(`/api/trips?driverUid=${user.uid}&status=active`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (tripRes.ok) {
          const tripData = await tripRes.json();
          if (tripData.success && tripData.data.length > 0) {
            const existingTrip = tripData.data[0] as Trip;
            setActiveTrip(existingTrip);
            setSelectedBusId(existingTrip.busId);
            // Resume tracking automatically
            await wakeLock.request();
            tracker.startTracking(existingTrip.id, existingTrip.busId, user.uid);
          }
        }
      } catch (err: unknown) {
        console.error("Error loading driver dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDriverData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStartTrip = async () => {
    if (!user || !selectedBusId) return;

    const bus = buses.find((b) => b.id === selectedBusId);
    if (!bus) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      // 1. Acquire Wake Lock
      await wakeLock.request();

      // 2. Start trip on server
      const idToken = await user.getIdToken();
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          busId: bus.id,
          routeId: bus.routeId,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData?.error?.message || "Failed to start trip on server");
      }

      const trip = resData.data as Trip;
      setActiveTrip(trip);

      // 3. Begin GPS Tracking
      const started = tracker.startTracking(trip.id, bus.id, user.uid);
      if (!started) {
        throw new Error("Geolocation could not be started.");
      }

      // 4. Send initial coordinate immediately so student map doesn't wait
      const firstCoord = currentRoute?.polyline?.[0] || [13.0827, 80.2707];
      if (firstCoord) {
        await tracker.manualUpdate(firstCoord[0], firstCoord[1], 0, 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error starting trip";
      setErrorMessage(msg);
      await wakeLock.release();
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip || !user) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      // 1. Stop GPS Watcher & transmit final ended state
      await tracker.stopTracking();

      // 2. Release Screen Wake Lock
      await wakeLock.release();

      // 3. Mark trip ended on server
      const idToken = await user.getIdToken();
      const res = await fetch("/api/trips", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tripId: activeTrip.id,
          busId: activeTrip.busId,
          delayMinutes: 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData?.error?.message || "Failed to finalize trip on server");
      }

      setActiveTrip(null);
      setShowEndConfirm(false);
      setIsSimulating(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error ending trip";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const currentBus = buses.find((b) => b.id === selectedBusId);
  const currentRoute = currentBus ? routes[currentBus.routeId] : undefined;

  // GPS Simulation loop for desktop testing
  useEffect(() => {
    if (!isSimulating || !activeTrip || !currentRoute?.polyline?.length) return;

    const interval = setInterval(async () => {
      const coords = currentRoute.polyline;
      simIndexRef.current = (simIndexRef.current + 1) % coords.length;
      const pt = coords[simIndexRef.current];
      if (pt) {
        await tracker.manualUpdate(pt[0], pt[1], 35, 90);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, activeTrip, currentRoute, tracker]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Initializing Driver Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with Driver info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Console</h1>
          <p className="text-xs text-muted-foreground">
            Real-Time Vehicle Position &amp; Route Telemetry
          </p>
        </div>
        {activeTrip && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Trip in Progress
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Screen Wake Lock HUD Banner */}
      <WakeLockWarning
        isSupported={wakeLock.isSupported}
        isActive={wakeLock.isActive}
        onRequestWakeLock={wakeLock.request}
      />

      {/* Bus and Route Selection */}
      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Vehicle Assignment
        </h2>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="busSelect"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Select Bus
            </label>
            <select
              id="busSelect"
              disabled={!!activeTrip || actionLoading}
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            >
              {buses.length === 0 ? (
                <option value="">No buses available</option>
              ) : (
                buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    Bus #{bus.number} ({bus.plate}) - Capacity: {bus.capacity}
                  </option>
                ))
              )}
            </select>
          </div>

          {currentRoute && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5 text-xs text-muted-foreground">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {currentRoute.name}
                </p>
                <p className="mt-0.5">{currentRoute.stopIds.length} scheduled stops</p>
              </div>
              <span className="rounded-lg border bg-background px-2.5 py-1 text-xs font-medium">
                Assigned Route
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Telemetry Display */}
      <GpsStatusCard
        isTracking={tracker.isTracking}
        isOnline={tracker.isOnline}
        position={tracker.currentPosition}
        pingsSent={tracker.pingsSent}
        droppedPings={tracker.droppedPings}
        queuedCount={tracker.queuedCount}
        error={tracker.error}
      />

      {/* Desktop Simulation Mode for live testing */}
      {activeTrip && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 p-4 dark:bg-blue-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                Desktop GPS Simulation Mode
              </p>
              <p className="text-xs text-muted-foreground">
                Simulates driving along the route (1 ping every 4s) so student map moves
                in real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSimulating((prev) => !prev)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow transition ${
                isSimulating
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSimulating ? "⏸ Pause Simulation" : "▶ Start Driving Simulation"}
            </button>
          </div>
        </div>
      )}

      {/* Big Action Button (Start / End Trip) */}
      <div className="pt-2">
        {!activeTrip ? (
          <button
            type="button"
            disabled={actionLoading || !selectedBusId || buses.length === 0}
            onClick={handleStartTrip}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {actionLoading ? "Starting Trip..." : "Start Trip (Begin GPS Sharing)"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => setShowEndConfirm(true)}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-destructive px-6 py-4 text-base font-bold text-destructive-foreground shadow-lg shadow-destructive/30 transition hover:bg-destructive/90 active:scale-[0.99] disabled:opacity-50"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <span>End Current Trip</span>
          </button>
        )}
      </div>

      {/* Confirmation Dialog for Ending Trip */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold tracking-tight">End Ongoing Trip?</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to conclude this trip? Live GPS transmission will
              cease immediately and your trip will be archived in college trip logs.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl border border-input bg-background py-2.5 text-xs font-semibold transition hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleEndTrip}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground shadow-sm transition hover:bg-destructive/90"
              >
                {actionLoading ? "Ending..." : "Yes, End Trip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
