"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { LiveBusLocation, Stop, BusRoute } from "@/types";
import { BusMarker } from "@/components/map/BusMarker";
import { StopMarker } from "@/components/map/StopMarker";
import { RoutePolyline } from "@/components/map/RoutePolyline";

interface LiveMapInnerProps {
  busLocation: LiveBusLocation | null;
  busNumber: string;
  route: BusRoute | null;
  stops: Stop[];
  myStopId?: string | null;
  className?: string;
}

// Controller component to programmatically pan/zoom
function MapController({
  busLocation,
  myStop,
  routePolyline,
  targetToCenter,
}: {
  busLocation: LiveBusLocation | null;
  myStop: Stop | undefined;
  routePolyline: [number, number][];
  targetToCenter: "bus" | "stop" | "route" | null;
}) {
  const map = useMap();
  const hasAutoFittedRef = useRef<boolean>(false);

  // Auto-fit route bounds once route polyline is available
  useEffect(() => {
    if (!hasAutoFittedRef.current && routePolyline.length > 0) {
      hasAutoFittedRef.current = true;
      const bounds = L.latLngBounds(routePolyline);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePolyline, map]);

  useEffect(() => {
    if (targetToCenter === "bus" && busLocation) {
      map.flyTo([busLocation.lat, busLocation.lng], 16, { animate: true });
    } else if (targetToCenter === "stop" && myStop) {
      map.flyTo([myStop.lat, myStop.lng], 16, { animate: true });
    } else if (targetToCenter === "route" && routePolyline.length > 0) {
      const bounds = L.latLngBounds(routePolyline);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [targetToCenter, busLocation, myStop, routePolyline, map]);

  return null;
}

export default function LiveMapInner({
  busLocation,
  busNumber,
  route,
  stops,
  myStopId,
  className = "h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border",
}: LiveMapInnerProps) {
  const [centerTarget, setCenterTarget] = useState<"bus" | "stop" | "route" | null>(null);
  const myStop = stops.find((s) => s.id === myStopId);

  // Initial center position (bus position or my stop or first stop or college campus default)
  const initialCenter: [number, number] = busLocation
    ? [busLocation.lat, busLocation.lng]
    : myStop
      ? [myStop.lat, myStop.lng]
      : stops[0]
        ? [stops[0].lat, stops[0].lng]
        : [13.0827, 80.2707]; // Fallback coordinates

  // Generate polyline from route.polyline or from stops
  const polylineCoords: [number, number][] =
    route?.polyline && route.polyline.length > 0
      ? route.polyline
      : stops.map((s) => [s.lat, s.lng]);

  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Route Geometry */}
        <RoutePolyline coordinates={polylineCoords} />

        {/* Route Stops */}
        {stops.map((stop, index) => (
          <StopMarker
            key={stop.id}
            stop={stop}
            isMyStop={stop.id === myStopId}
            sequenceNumber={index + 1}
          />
        ))}

        {/* Live Bus Marker */}
        {busLocation && (
          <BusMarker location={busLocation} busNumber={busNumber} autoCenter={false} />
        )}

        <MapController
          busLocation={busLocation}
          myStop={myStop}
          routePolyline={polylineCoords}
          targetToCenter={centerTarget}
        />
      </MapContainer>

      {/* Floating View Controls */}
      <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
        {busLocation && (
          <button
            type="button"
            aria-label="Focus map view on moving bus"
            onClick={() => {
              setCenterTarget(null);
              setTimeout(() => setCenterTarget("bus"), 10);
            }}
            className="flex items-center gap-1.5 rounded-xl border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-accent"
          >
            <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
            Focus Bus
          </button>
        )}

        {myStop && (
          <button
            type="button"
            aria-label={`Focus map view on designated stop: ${myStop.name}`}
            onClick={() => {
              setCenterTarget(null);
              setTimeout(() => setCenterTarget("stop"), 10);
            }}
            className="flex items-center gap-1.5 rounded-xl border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-accent"
          >
            ⭐ Focus My Stop
          </button>
        )}

        {polylineCoords.length > 0 && (
          <button
            type="button"
            aria-label="Fit map view to entire route bounds"
            onClick={() => {
              setCenterTarget(null);
              setTimeout(() => setCenterTarget("route"), 10);
            }}
            className="flex items-center gap-1.5 rounded-xl border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur transition hover:bg-accent"
          >
            Fit Route
          </button>
        )}
      </div>
    </div>
  );
}
