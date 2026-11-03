"use client";

import React from "react";
import { EtaResult } from "@/types";
import { formatDuration } from "@/lib/utils";

interface EtaBadgeProps {
  eta: EtaResult | null;
  isLoading: boolean;
  stopName: string;
}

export function EtaBadge({ eta, isLoading, stopName }: EtaBadgeProps) {
  if (isLoading && !eta) {
    return (
      <div className="flex animate-pulse items-center justify-between rounded-2xl border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-muted"></div>
          <div className="h-7 w-40 rounded bg-muted"></div>
        </div>
        <div className="h-10 w-10 rounded-full bg-muted"></div>
      </div>
    );
  }

  if (!eta) {
    return (
      <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
        <p className="text-xs text-muted-foreground">
          ETA to <strong className="text-foreground">{stopName}</strong> will calculate
          once the bus starts moving.
        </p>
      </div>
    );
  }

  const distanceKm = (eta.distanceMeters / 1000).toFixed(1);
  const formattedTime = formatDuration(eta.durationSeconds);

  return (
    <div
      role="region"
      aria-label="Estimated Arrival Information"
      aria-live="polite"
      className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Estimated Arrival
          </p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {eta.source === "osrm" ? "Road Network" : "Speed Avg"}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-extrabold tracking-tight text-primary">
            ~{formattedTime}
          </p>
          <span className="text-xs font-medium text-muted-foreground">
            ({distanceKm} km to {stopName})
          </span>
        </div>
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    </div>
  );
}
