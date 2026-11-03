"use client";

import dynamic from "next/dynamic";
import { LiveBusLocation, Stop, BusRoute } from "@/types";

interface LiveMapProps {
  busLocation: LiveBusLocation | null;
  busNumber: string;
  route: BusRoute | null;
  stops: Stop[];
  myStopId?: string | null;
  className?: string;
}

const DynamicLiveMap = dynamic(() => import("@/components/map/LiveMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] w-full flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/30">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-medium text-muted-foreground">
        Loading OpenStreetMap tiles...
      </p>
    </div>
  ),
});

export function LiveMap(props: LiveMapProps) {
  return <DynamicLiveMap {...props} />;
}
