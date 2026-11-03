"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useLiveBus } from "@/hooks/useLiveBus";
import { LiveMap } from "@/components/map/LiveMap";
import { SignalStatusBadge } from "@/features/tracking/SignalStatusBadge";
import { EtaBadge } from "@/features/tracking/EtaBadge";
import { Bus, BusRoute, Stop, EtaResult } from "@/types";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const allocatedBusId = profile?.allocatedBusId;
  const myStopId = profile?.stopId;

  const [bus, setBus] = useState<Bus | null>(null);
  const [route, setRoute] = useState<BusRoute | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [eta, setEta] = useState<EtaResult | null>(null);
  const [etaLoading, setEtaLoading] = useState<boolean>(false);

  // Subscribe to live bus position from Realtime DB
  const liveBus = useLiveBus(allocatedBusId);

  // Load static allocations from Firestore
  useEffect(() => {
    async function loadAllocations() {
      if (!user) return;
      if (!allocatedBusId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch allocated bus
        const busDocSnap = await getDoc(doc(db, "buses", allocatedBusId));
        if (!busDocSnap.exists()) {
          setLoading(false);
          return;
        }

        const busData = { id: busDocSnap.id, ...busDocSnap.data() } as Bus;
        setBus(busData);

        // Fetch route
        if (busData.routeId) {
          const routeDocSnap = await getDoc(doc(db, "routes", busData.routeId));
          if (routeDocSnap.exists()) {
            setRoute({ id: routeDocSnap.id, ...routeDocSnap.data() } as BusRoute);
          }
        }

        // Fetch stops
        const stopsSnap = await getDocs(collection(db, "stops"));
        const stopList = stopsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Stop[];
        setStops(stopList);
      } catch (err) {
        console.error("Error loading student allocation data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllocations();
  }, [user, allocatedBusId]);

  // Query ETA when live bus position changes
  useEffect(() => {
    async function updateEta() {
      if (!liveBus.location || !liveBus.isOnTrip || !myStopId) {
        setEta(null);
        return;
      }

      const myStop = stops.find((s) => s.id === myStopId);
      if (!myStop) return;

      try {
        setEtaLoading(true);
        const queryParams = new URLSearchParams({
          busLat: liveBus.location.lat.toString(),
          busLng: liveBus.location.lng.toString(),
          stopLat: myStop.lat.toString(),
          stopLng: myStop.lng.toString(),
          speed: (liveBus.location.speed || 0).toString(),
        });

        const res = await fetch(`/api/eta?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setEta(json.data as EtaResult);
          }
        }
      } catch (err) {
        console.warn("ETA fetch error:", err);
      } finally {
        setEtaLoading(false);
      }
    }

    // Debounce ETA calls
    const handler = setTimeout(() => {
      updateEta();
    }, 1500);

    return () => clearTimeout(handler);
  }, [liveBus.location, liveBus.isOnTrip, myStopId, stops]);

  const myStop = stops.find((s) => s.id === myStopId);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading your live bus route...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-4 sm:p-6 md:p-8">
        {/* Unallocated Notice */}
        {!allocatedBusId ? (
          <div className="mx-auto my-12 max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">No Bus Allocated Yet</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your student account (
              <span className="font-semibold text-foreground">{user?.email}</span>) has
              not been assigned a specific bus route yet. Once the administration uploads
              transport allocations, your live tracker will activate automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Header / Bus Info */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    Bus #{bus?.number || "—"}
                  </h1>
                  <span className="rounded-lg bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {bus?.plate}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Route:{" "}
                  <strong className="text-foreground">
                    {route?.name || "Campus Transit"}
                  </strong>
                  {myStop && (
                    <>
                      {" "}
                      &bull; My Stop:{" "}
                      <strong className="text-primary">{myStop.name}</strong>
                    </>
                  )}
                </p>
              </div>

              <div>
                <SignalStatusBadge
                  secondsSinceUpdate={liveBus.secondsSinceUpdate}
                  isSignalLost={liveBus.isSignalLost}
                  isOnTrip={liveBus.isOnTrip}
                />
              </div>
            </div>

            {/* Inactive Trip Notice */}
            {!liveBus.isOnTrip && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-300">
                <svg
                  className="h-5 w-5 shrink-0 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold">
                    Bus is currently parked / on standby
                  </p>
                  <p className="mt-0.5">
                    Live GPS tracking and real-time road ETAs will start streaming when
                    the driver starts the trip.
                  </p>
                </div>
              </div>
            )}

            {/* ETA Badge */}
            {liveBus.isOnTrip && (
              <EtaBadge
                eta={eta}
                isLoading={etaLoading}
                stopName={myStop?.name || "your stop"}
              />
            )}

            {/* Live Leaflet Map */}
            <LiveMap
              busLocation={liveBus.location}
              busNumber={bus?.number || ""}
              route={route}
              stops={stops}
              myStopId={myStopId}
              className="h-[480px] w-full overflow-hidden rounded-2xl border shadow-sm"
            />
          </>
        )}
      </main>
    </div>
  );
}
