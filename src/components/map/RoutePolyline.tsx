"use client";

import { Polyline } from "react-leaflet";

interface RoutePolylineProps {
  coordinates: [number, number][];
}

export function RoutePolyline({ coordinates }: RoutePolylineProps) {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return (
    <>
      {/* Route background halo for better contrast over maps */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#ffffff",
          weight: 8,
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* Active route foreground line */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#2563eb",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </>
  );
}
