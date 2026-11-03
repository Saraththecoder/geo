"use client";

import React from "react";
import { LiveBusLocation } from "@/types";

interface GpsStatusCardProps {
  isTracking: boolean;
  isOnline: boolean;
  position: LiveBusLocation | null;
  pingsSent: number;
  droppedPings: number;
  queuedCount: number;
  error: string | null;
}

export function GpsStatusCard({
  isTracking,
  isOnline,
  position,
  pingsSent,
  droppedPings,
  queuedCount,
  error,
}: GpsStatusCardProps) {
  // Speed in km/h
  const speedKmH = position?.speed ? Math.round(position.speed * 3.6) : 0;
  const accuracy = position?.accuracy ?? 0;

  const getAccuracyBadge = (acc: number) => {
    if (acc === 0) return { label: "No Fix", color: "bg-slate-100 text-slate-700" };
    if (acc <= 15)
      return {
        label: `±${acc}m (High)`,
        color:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      };
    if (acc <= 30)
      return {
        label: `±${acc}m (Good)`,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      };
    return {
      label: `±${acc}m (Fair)`,
      color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    };
  };

  const accuracyBadge = getAccuracyBadge(accuracy);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold">GPS Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Speedometer */}
        <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Speed
          </p>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold tracking-tight">{speedKmH}</span>
            <span className="text-xs font-medium text-muted-foreground">km/h</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            GPS Accuracy
          </p>
          <div className="mt-3 flex items-center justify-center">
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${accuracyBadge.color}`}
            >
              {accuracyBadge.label}
            </span>
          </div>
        </div>

        {/* Transmitted Pings */}
        <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pings Synced
          </p>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-primary">
              {pingsSent}
            </span>
            <span className="text-xs text-muted-foreground">sent</span>
          </div>
        </div>

        {/* Network / Queued Status */}
        <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Network
          </p>
          <div className="mt-3 flex flex-col items-center justify-center gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isOnline
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
            {queuedCount > 0 && (
              <span className="text-[10px] font-medium text-amber-600">
                {queuedCount} queued
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lat / Lng HUD footer */}
      {position && isTracking && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Lat: <strong className="text-foreground">{position.lat.toFixed(6)}</strong>
            </span>
            <span>
              Lng: <strong className="text-foreground">{position.lng.toFixed(6)}</strong>
            </span>
            <span>
              Heading:{" "}
              <strong className="text-foreground">{Math.round(position.heading)}°</strong>
            </span>
          </div>
          {droppedPings > 0 && (
            <span className="text-[11px] text-muted-foreground/80">
              Dropped {droppedPings} inaccurate fixes (&gt;50m)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
