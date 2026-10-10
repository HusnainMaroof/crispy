"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { MapLocation, MapPoint } from "./locations-map";

type MapProps = {
  locations: MapLocation[];
  selectedId: string;
  onSelect?: (id: string) => void;
  origin?: MapPoint | null;
  directionsHref?: string | null;
  onPickOrigin?: (point: MapPoint) => void;
  onLocate?: () => void;
  locating?: boolean;
};

export default function ClientLocationsMap(props: MapProps) {
  const [MapView, setMapView] = useState<ComponentType<MapProps> | null>(null);

  useEffect(() => {
    let active = true;
    void import("./locations-map").then((mod) => {
      if (active) setMapView(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!MapView) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
        Loading map…
      </div>
    );
  }

  return <MapView {...props} />;
}
