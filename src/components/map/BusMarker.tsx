"use client";

import { useEffect, useRef } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { LiveBusLocation } from "@/types";

interface BusMarkerProps {
  location: LiveBusLocation;
  busNumber: string;
  autoCenter?: boolean;
}

export function BusMarker({ location, busNumber, autoCenter = false }: BusMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  const isActive = location.status === "active";
  const bgClass = isActive ? "bg-primary" : "bg-slate-600";
  const statusLabel = isActive ? `Bus #${busNumber}` : `Bus #${busNumber} (Parked)`;

  // Smooth heading rotation & bus icon styling
  const busIcon = L.divIcon({
    className: "bus-custom-marker",
    html: `
      <div style="transform: rotate(${location.heading || 0}deg); transition: transform 0.5s ease;" class="relative flex items-center justify-center">
        <div class="h-11 w-11 rounded-2xl ${bgClass} text-white shadow-xl flex items-center justify-center border-2 border-white ring-4 ${
          isActive ? "ring-primary/20" : "ring-slate-400/20"
        }">
          <svg style="width: 22px; height: 22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 17h.01M16 17h.01M9 11h6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm0 0v2m14-2v2" />
          </svg>
        </div>
        <div style="top: -24px;" class="absolute whitespace-nowrap rounded-md ${
          isActive ? "bg-slate-900/90 text-white" : "bg-slate-700/90 text-slate-200"
        } px-2 py-0.5 text-[10px] font-bold shadow">
          ${statusLabel}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  useEffect(() => {
    if (
      markerRef.current &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    ) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    }
    if (
      autoCenter &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    ) {
      map.panTo([location.lat, location.lng], { animate: true, duration: 1 });
    }
  }, [location.lat, location.lng, autoCenter, map]);

  return (
    <Marker ref={markerRef} position={[location.lat, location.lng]} icon={busIcon}>
      <Popup className="bus-popup">
        <div className="space-y-1 p-1 text-xs">
          <p className="text-sm font-bold text-foreground">Bus #{busNumber}</p>
          <p className="text-muted-foreground">
            Speed: {Math.round((location.speed || 0) * 3.6)} km/h
          </p>
          <p className="text-muted-foreground">
            Accuracy: ±{Math.round(location.accuracy)}m
          </p>
          <p className="text-muted-foreground">
            Heading: {Math.round(location.heading)}°
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
