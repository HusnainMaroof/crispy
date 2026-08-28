// locations-map.tsx
// Client-only — imported via next/dynamic({ ssr: false }) from locations.tsx.
// The Leaflet map is created imperatively (not via react-leaflet's MapContainer)
// so the instance's lifecycle is fully controlled: StrictMode remounts and
// Turbopack HMR can otherwise leave a stale instance on the DOM node and
// throw "Map container is being reused by another instance".
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-overrides.css";

export type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

// CARTO basemaps require an API key — without it tiles render with an
// "API key required" watermark instead of map imagery.
const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_BASECMAPS_API_KEY ?? "";

const DARK_TILE_URL = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;

const LONDON_CENTER: [number, number] = [51.5074, -0.1278];

const PIN_SVG = (num: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="52" height="69" viewBox="0 0 52 69" fill="none">
  <path
    d="M48.7817 13.1748C46.0509 8.06718 41.6183 4.16943 36.214 1.8682C30.689 -0.476685 24.5607 -0.576467 18.8389 1.35682C14.2157 2.92215 10.0371 5.54144 6.74115 9.08371C2.83557 13.2808 0.676393 18.5506 0.142949 24.182C-0.860435 34.865 3.52143 45.2673 10.0498 53.6926C14.3808 59.2805 19.7026 63.9079 25.6848 67.7058C26.5104 68.2297 27.247 68.0863 28.0091 67.5998C30.1619 66.2091 32.1814 64.8496 34.15 63.1657C41.1547 57.1601 46.5018 49.5579 49.5374 40.8893C52.6301 32.0399 53.2651 21.5565 48.7753 13.1748H48.7817Z"
    fill="#E21E2F"
  />
  <circle cx="26" cy="27.19" r="19.6822" fill="white" />
  <text
    x="26"
    y="27.19"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Poppins, sans-serif"
    font-size="23"
    font-weight="700"
    letter-spacing="0.54px"
    fill="#1E1E1E"
  >${num}</text>
</svg>`;

function pinIcon(num: number): L.DivIcon {
  return L.divIcon({
    className: "crispy-pin-wrap",
    html: PIN_SVG(num),
    iconSize: [52, 69],
    iconAnchor: [26, 69],
    popupAnchor: [0, -69],
  });
}

function isMapAlive(map: L.Map | null): boolean {
  try {
    return Boolean(map && map.getContainer()?.isConnected);
  } catch {
    return false;
  }
}

// DOM node property holding the map instance we created for it, so a remount
// (StrictMode/HMR) can always destroy a leftover instance before re-init.
type MapHostElement = HTMLDivElement & {
  _leaflet_id?: number;
  __crispyMap?: L.Map;
};

export default function LocationsMap({
  locations,
  selectedId,
}: {
  locations: MapLocation[];
  selectedId: string;
}) {
  const hostRef = useRef<MapHostElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const skipFirstFlyRef = useRef(true);

  const initialCenter: [number, number] = locations[0]
    ? [locations[0].lat, locations[0].lng]
    : LONDON_CENTER;
  const selected =
    locations.find((l) => l.id === selectedId) ?? locations[0] ?? null;

  // Bumped after each successful map init so dependent effects re-run on
  // StrictMode remounts, where mapRef swaps to a brand-new instance.
  const [mapEpoch, setMapEpoch] = useState(0);
  const initialCenterRef = useRef(initialCenter);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    // Destroy any instance a previous mount left on this DOM node — without
    // this, L.map() throws "Map container is being reused by another instance".
    const stale = el.__crispyMap;
    if (stale) {
      try {
        stale.remove();
      } catch {
        /* already torn down */
      }
      el.__crispyMap = undefined;
    }
    delete el._leaflet_id;

    const map = L.map(el, {
      center: initialCenterRef.current,
      zoom: 13,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;
    el.__crispyMap = map;

    L.tileLayer(DARK_TILE_URL, {
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    let cancelled = false;
    map.whenReady(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!cancelled && isMapAlive(map)) map.invalidateSize();
        }, 50);
      });
    });

    setMapEpoch((e) => e + 1);

    return () => {
      cancelled = true;
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch {
          /* ignore */
        }
        markerRef.current = null;
      }
      try {
        map.remove();
      } catch {
        /* ignore */
      }
      if (mapRef.current === map) mapRef.current = null;
      if (el.__crispyMap === map) el.__crispyMap = undefined;
      delete el._leaflet_id;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep exactly one marker on the map: the selected location's pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map) || !selected) return;

    if (markerRef.current) {
      try {
        markerRef.current.remove();
      } catch {
        /* ignore */
      }
      markerRef.current = null;
    }

    const idx = locations.findIndex((l) => l.id === selected.id);
    try {
      markerRef.current = L.marker([selected.lat, selected.lng], {
        icon: pinIcon(idx + 1),
        zIndexOffset: 1000,
      }).addTo(map);
    } catch {
      /* map torn down mid-update */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapEpoch, selected?.id]);

  // Fly to the selection, skipping the initial mount.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map) || !selected) return;

    if (skipFirstFlyRef.current) {
      skipFirstFlyRef.current = false;
      return;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      if (reduceMotion) {
        map.setView([selected.lat, selected.lng], 13, { animate: false });
      } else {
        map.flyTo([selected.lat, selected.lng], 13, {
          duration: 1.1,
          easeLinearity: 0.3,
        });
      }
    } catch {
      // Map torn down mid-call (React Strict Mode remount) — ignore.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapEpoch, selected?.lat, selected?.lng]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={hostRef} className="crispy-map h-full w-full" />

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
