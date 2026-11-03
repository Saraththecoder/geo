"use client";

import React from "react";

interface SignalStatusBadgeProps {
  secondsSinceUpdate: number;
  isSignalLost: boolean;
  isOnTrip: boolean;
}

export function SignalStatusBadge({
  secondsSinceUpdate,
  isSignalLost,
  isOnTrip,
}: SignalStatusBadgeProps) {
  if (!isOnTrip) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        Bus Standby (No active trip)
      </span>
    );
  }

  if (isSignalLost) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400"
      >
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Signal Lost ({secondsSinceUpdate}s ago)
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </span>
      Live • Updated{" "}
      {secondsSinceUpdate === 0 ? "just now" : `${secondsSinceUpdate}s ago`}
    </span>
  );
}
