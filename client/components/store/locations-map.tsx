// locations-map.tsx
// Client-only — imported via next/dynamic({ ssr: false }) from locations.tsx.
// Leaflet touches `window` at import time, so this file must never be
// server-rendered.
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
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

const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const LONDON_CENTER: [number, number] = [51.5074, -0.1278];

function markerIcon(number: number, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "crispy-marker-wrap",
    html: `
      <div class="crispy-marker">
        <span class="crispy-marker-dot${selected ? " is-selected" : ""}">${number}</span>
        <span class="crispy-marker-tail"></span>
      </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });
}

/** True only while the Leaflet map instance still owns a live DOM pane. */
function isMapAlive(map: L.Map): boolean {
  try {
    const el = map.getContainer();
    // _mapPane is created in Map._initPanes; missing ⇒ mid-teardown (Strict Mode)
    // or not finished init yet — flyTo would throw appendChild on undefined.
    const panes = (map as unknown as { _panes?: { mapPane?: HTMLElement } })
      ._panes;
    return Boolean(el?.isConnected && panes?.mapPane);
  } catch {
    return false;
  }
}

// Leaflet measures its container once on mount. With dynamic ssr:false +
// absolute/flex layout, that size can be wrong until a resize. Recheck after
// the map reports ready so tiles paint at the real dimensions.
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled || !isMapAlive(map)) return;
      map.invalidateSize();
    };
    map.whenReady(() => {
      requestAnimationFrame(() => {
        setTimeout(run, 50);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [map]);
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  // MapContainer already opens on the first location — skip the initial
  // flyTo (it races pane creation and is what throws appendChild).
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    let cancelled = false;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (cancelled || !isMapAlive(map)) return;
      try {
        if (reduceMotion) {
          map.setView([lat, lng], 13, { animate: false });
        } else {
          map.flyTo([lat, lng], 13, { duration: 1.1, easeLinearity: 0.3 });
        }
      } catch {
        // Map torn down mid-call (React Strict Mode remount) — ignore.
      }
    };

    map.whenReady(() => {
      requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      if (isMapAlive(map)) {
        try {
          map.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [lat, lng, map]);

  return null;
}

export default function LocationsMap({
  locations,
  selectedId,
}: {
  locations: MapLocation[];
  selectedId: string;
}) {
  const initialCenter: [number, number] = locations[0]
    ? [locations[0].lat, locations[0].lng]
    : LONDON_CENTER;
  const selected =
    locations.find((l) => l.id === selectedId) ?? locations[0] ?? null;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom={false}
        attributionControl={false}
        className="crispy-map h-full w-full"
      >
        <TileLayer
          url={DARK_TILE_URL}
          subdomains="abcd"
          maxZoom={20}
          eventHandlers={{
            tileerror: (e) => {
              console.error("Map tile failed to load:", e);
            },
          }}
        />

        {locations.map((loc, i) => {
          const isSelected = loc.id === selectedId;
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={markerIcon(i + 1, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Tooltip
                direction="top"
                offset={[0, -14]}
                className="crispy-tooltip"
              >
                {loc.name}
              </Tooltip>
            </Marker>
          );
        })}

        {selected && <FlyTo lat={selected.lat} lng={selected.lng} />}
        <InvalidateSizeOnMount />
      </MapContainer>

      {/* Outside MapContainer — Leaflet owns that DOM tree; raw React
          children inside it can fight pane creation (appendChild crashes). */}
      <div className="pointer-events-none absolute top-2 right-2 z-[1000] text-[9px] leading-none text-white/45">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto transition-colors hover:text-white"
        >
          © OpenStreetMap
        </a>{" "}
        ·{" "}
        <a
          href="https://carto.com/attributions"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto transition-colors hover:text-white"
        >
          © CARTO
        </a>
      </div>
    </div>
  );
}
