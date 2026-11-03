"use client";

import { useState, useEffect } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/95 p-4 text-xs font-medium text-white shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom"
    >
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.828m2.829 2.828L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.828m-4.243 4.243a9 9 0 01-2.829-2.828M3 3l18 18M9.879 9.879a3 3 0 004.242 4.242"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-bold">Offline Mode Active</p>
          <p className="mt-0.5 text-amber-100">
            You are currently offline. Showing cached route data. Live GPS streaming will
            resume automatically when connected.
          </p>
        </div>
      </div>
    </aside>
  );
}
