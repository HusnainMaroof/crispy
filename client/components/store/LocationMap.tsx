// locations-map.tsx
// Client-only — imported via next/dynamic({ ssr: false }) from locations.tsx.
// Leaflet touches `window` at import time, so this file must never be
// server-rendered — that's the classic Next.js + Leaflet crash if you
// import it directly instead of through dynamic().
"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Must load AFTER leaflet.css so these overrides win against both it and
// Tailwind Preflight's `img { max-width: 100%; height: auto }` reset,
// which otherwise breaks tile rendering (squashed/blank tiles, no roads).
import "./leaflet-overrides.css";

export type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

function pinIcon(active: boolean, num: string) {
  const size = active ? 40 : 34;
  const fontSize = active ? 18 : 15;
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:${size}px;height:${size}px;border-radius:9999px;
          background:#FF0931;border:3px solid white;
          box-shadow:0 4px 10px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          transition:width .2s ease,height .2s ease;
        ">
          <span style="
            color:white;line-height:1;font-size:${fontSize}px;
            font-family:var(--font-bebas), 'Bebas Neue', sans-serif;
          ">${num}</span>
        </div>
        <div style="
          width:0;height:0;margin-top:-1px;
          border-left:6px solid transparent;border-right:6px solid transparent;
          border-top:8px solid #FF0931;
        "></div>
      </div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 12],
  });
}

// Leaflet measures its container's size once on mount. If that happens
// before the surrounding flex/absolute layout has finished settling (easy
// to hit with a dynamic ssr:false import), the map can lock in a wrong
// size until the window is resized. Forcing a recheck a tick after mount
// fixes that without needing a ResizeObserver for this simple case.
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

// Runs the fly-to animation whenever the selected location changes.
// Kept as its own component because useMap() only works inside MapContainer.
function FlyToSelected({ location }: { location: MapLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lng], 14, { duration: 1.1 });
  }, [location, map]);
  return null;
}

export default function LocationsMap({
  locations,
  selectedId,
}: {
  locations: MapLocation[];
  selectedId: string | null;
}) {
  const selected = locations.find((l) => l.id === selectedId) ?? locations[0] ?? null;
  if (!selected) return null;

  return (
    <MapContainer
      center={[selected.lat, selected.lng]}
      zoom={12}
      scrollWheelZoom={false}
      className="absolute inset-0 z-0"
    >
      {/*
        Switched off OSM's {s}.tile.openstreetmap.org — that subdomain
        load-balancing scheme is deprecated on OSM's end and commonly gets
        silently throttled/dropped for unregistered dev traffic, which
        shows up exactly as "tiles never load." CARTO's tiles are free,
        need no API key, and don't have that problem.

        Still same production caveat as before: check CARTO's usage policy
        before high-traffic production use — swap to a paid tier (Stadia
        Maps, MapTiler, Mapbox) if this site gets real volume.
      */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        eventHandlers={{
          tileerror: (e) => {
            // If tiles still fail, this logs the real cause (CORS, CSP,
            // network block, ad-blocker) to the console instead of
            // failing silently as a blank map.
            console.error("Map tile failed to load:", e);
          },
        }}
      />
      {locations.map((loc, i) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={pinIcon(loc.id === selectedId, String(i + 1).padStart(2, "0"))}
        />
      ))}
      <FlyToSelected location={selected} />
      <InvalidateSizeOnMount />
    </MapContainer>
  );
}