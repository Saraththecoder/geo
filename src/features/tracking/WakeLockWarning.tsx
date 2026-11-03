"use client";

import React from "react";

interface WakeLockWarningProps {
  isSupported: boolean;
  isActive: boolean;
  onRequestWakeLock: () => void;
}

export function WakeLockWarning({
  isSupported,
  isActive,
  onRequestWakeLock,
}: WakeLockWarningProps) {
  if (isActive) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-medium">Screen Stay-Awake Active</span>
        </div>
        <span className="text-[11px] opacity-80">Display won&apos;t sleep</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
      <div className="flex items-start gap-2.5">
        <svg
          className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
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
        <div className="space-y-1">
          <p className="text-sm font-semibold">Keep Screen Awake Required</p>
          <p className="leading-relaxed">
            Mobile browsers strictly throttle or suspend GPS background tracking when the
            screen turns off or the tab is minimized.
          </p>
        </div>
      </div>

      {isSupported ? (
        <button
          type="button"
          onClick={onRequestWakeLock}
          className="mt-1 w-full rounded-lg bg-amber-600 px-3 py-2 font-medium text-white shadow-sm transition hover:bg-amber-700"
        >
          Enable Screen Wake Lock
        </button>
      ) : (
        <p className="text-[11px] italic text-amber-700/80 dark:text-amber-400/80">
          Wake Lock API is not supported on this device. Please adjust your phone&apos;s
          display timeout to &ldquo;Never&rdquo; while driving.
        </p>
      )}
    </div>
  );
}
