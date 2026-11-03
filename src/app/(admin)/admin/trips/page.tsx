"use client";

import { useEffect, useState } from "react";
import { Trip, Bus, UserProfile } from "@/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatDuration } from "@/lib/utils";

export default function AdminTripsHistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusFilter, setSelectedBusFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsSnap, busesSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "trips"), orderBy("startedAt", "desc"))),
        getDocs(collection(db, "buses")),
        getDocs(collection(db, "users")),
      ]);

      setTrips(tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Trip[]);
      setBuses(busesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Bus[]);
      setDrivers(
        usersSnap.docs
          .map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
          .filter((u) => u.role === "driver")
      );
    } catch (err) {
      console.error("Error loading trip logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const busMap = new Map(buses.map((b) => [b.id, b.number]));
  const driverMap = new Map(drivers.map((d) => [d.uid, d.name]));

  // Compute metrics & statistics
  const totalTrips = trips.length;
  const activeTripsCount = trips.filter((t) => t.status === "active").length;
  const completedTrips = trips.filter((t) => t.status === "ended");
  const totalDelayMinutes = completedTrips.reduce(
    (acc, t) => acc + (t.delayMinutes || 0),
    0
  );
  const avgDelayMinutes =
    completedTrips.length > 0
      ? (totalDelayMinutes / completedTrips.length).toFixed(1)
      : "0.0";
  const onTimeTrips = completedTrips.filter((t) => (t.delayMinutes || 0) <= 5).length;
  const onTimePercentage =
    completedTrips.length > 0
      ? Math.round((onTimeTrips / completedTrips.length) * 100)
      : 100;

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    if (selectedBusFilter !== "all" && t.busId !== selectedBusFilter) return false;
    if (selectedStatusFilter !== "all" && t.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Trip Logs &amp; Delay Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitor real-time transit status, completed route logs, and punctuality trends
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-muted"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Total Trips
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{totalTrips}</span>
            {activeTripsCount > 0 && (
              <span className="text-xs font-semibold text-emerald-600">
                ({activeTripsCount} active)
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            On-Time Rate
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {onTimePercentage}%
            </span>
            <span className="text-xs text-muted-foreground">(&le;5m delay)</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Average Delay
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold">{avgDelayMinutes}</span>
            <span className="text-xs text-muted-foreground">mins</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Cumulative Delays
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-amber-600">
              {totalDelayMinutes}
            </span>
            <span className="text-xs text-muted-foreground">total mins</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Bus Filter:
          </label>
          <select
            value={selectedBusFilter}
            onChange={(e) => setSelectedBusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium"
          >
            <option value="all">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                Bus #{b.number} ({b.plate})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Status:</label>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium"
          >
            <option value="all">All Trips</option>
            <option value="active">Active Only</option>
            <option value="ended">Ended Only</option>
          </select>
        </div>
      </div>

      {/* Trips Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-xs text-muted-foreground">
          No trip logs matching the current filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 font-semibold">Bus</th>
                <th className="p-3 font-semibold">Driver</th>
                <th className="p-3 font-semibold">Started At</th>
                <th className="p-3 font-semibold">Duration</th>
                <th className="p-3 font-semibold">Delay</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTrips.map((trip) => {
                const busNumber = busMap.get(trip.busId) || "—";
                const driverName = driverMap.get(trip.driverUid) || "Driver";
                const startDate = new Date(trip.startedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const durationSeconds = trip.endedAt
                  ? Math.round((trip.endedAt - trip.startedAt) / 1000)
                  : Math.round((Date.now() - trip.startedAt) / 1000);

                const delayColor =
                  trip.delayMinutes <= 0
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                    : trip.delayMinutes <= 10
                      ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                      : "text-destructive bg-destructive/10";

                return (
                  <tr key={trip.id} className="hover:bg-muted/20">
                    <td className="p-3 font-bold text-foreground">Bus #{busNumber}</td>
                    <td className="p-3">{driverName}</td>
                    <td className="p-3 text-muted-foreground">{startDate}</td>
                    <td className="p-3">{formatDuration(durationSeconds)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${delayColor}`}
                      >
                        {trip.delayMinutes > 0
                          ? `+${trip.delayMinutes}m delay`
                          : "On Time"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          trip.status === "active"
                            ? "border border-emerald-500/20 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {trip.status === "active" && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        )}
                        {trip.status === "active" ? "In Progress" : "Completed"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
