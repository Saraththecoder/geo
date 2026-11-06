"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Stop } from "@/types";

interface StopMarkerProps {
  stop: Stop;
  isMyStop: boolean;
  sequenceNumber?: number;
}

export function StopMarker({ stop, isMyStop, sequenceNumber }: StopMarkerProps) {
  const icon = L.divIcon({
    className: "stop-custom-marker",
    html: isMyStop
      ? `
        <div class="relative flex flex-col items-center">
          <span class="absolute -top-1 -right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] text-white font-bold items-center justify-center">★</span>
          </span>
          <div class="h-9 w-9 rounded-full bg-amber-500 text-white shadow-xl flex items-center justify-center border-2 border-white ring-4 ring-amber-500/30">
            <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <div class="mt-1 whitespace-nowrap rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-md">
            My Stop
          </div>
        </div>
      `
      : `
        <div class="relative flex flex-col items-center">
          <div class="h-6 w-6 rounded-full bg-slate-700 text-white shadow-md flex items-center justify-center border-2 border-white text-[10px] font-bold">
            ${sequenceNumber ?? ""}
          </div>
        </div>
      `,
    iconSize: isMyStop ? [36, 56] : [24, 24],
    iconAnchor: isMyStop ? [18, 28] : [12, 12],
  });

  return (
    <Marker position={[stop.lat, stop.lng]} icon={icon}>
      <Popup>
        <div className="space-y-1 p-1 text-xs">
          <p className="text-sm font-bold text-foreground">
            {isMyStop && "⭐ "}
            {stop.name}
          </p>
          {isMyStop && (
            <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Your Designated Boarding Stop
            </span>
          )}
          {stop.pickupTime && (
            <div className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <span>🕒 Pickup:</span>
              <span>{stop.pickupTime}</span>
            </div>
          )}
          <p className="text-muted-foreground">
            Lat: {stop.lat.toFixed(5)}, Lng: {stop.lng.toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
