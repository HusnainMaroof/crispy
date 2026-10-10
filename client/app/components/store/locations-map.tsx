// locations-map.tsx
// Client-only — imported via next/dynamic({ ssr: false }) from locations.tsx.
// The Leaflet map is created imperatively.
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

export type MapPoint = { lat: number; lng: number };

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

function pinIcon(num: number, active = false): L.DivIcon {
  return L.divIcon({
    className: "crispy-pin-wrap",
    html: `<span style="display:block;transform:scale(${
      active ? 1.18 : 1
    });transform-origin:50% 100%;transition:transform 200ms ease;${
      active ? "filter:drop-shadow(0 6px 10px rgba(0,0,0,0.45));" : ""
    }">${PIN_SVG(num)}</span>`,
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
  onSelect,
  origin = null,
  directionsHref = null,
  onPickOrigin,
  onLocate,
  locating = false,
}: {
  locations: MapLocation[];
  selectedId: string;
  onSelect?: (id: string) => void;
  /** Customer start point. Drawn as its own marker, separate from the branch pins. */
  origin?: MapPoint | null;
  /** Google Maps directions link for the selected branch, shown at the bottom of the map. */
  directionsHref?: string | null;
  /** A map click sets the start point. */
  onPickOrigin?: (point: MapPoint) => void;
  /** Asks the browser for the customer's position (crosshair button). */
  onLocate?: () => void;
  locating?: boolean;
}) {
  const hostRef = useRef<MapHostElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const skipFirstFlyRef = useRef(true);
  const didFitBoundsRef = useRef(false);

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

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      markers.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          /* ignore */
        }
      });
      markers.clear();
      try {
        map.remove();
      } catch {
        /* ignore */
      }
      if (mapRef.current === map) mapRef.current = null;
      if (el.__crispyMap === map) el.__crispyMap = undefined;
      delete el._leaflet_id;
    };
  }, []);

  // Render every branch as a pin; the selected one is enlarged and raised.
  // Clicking a pin selects that branch, which bubbles up to the card list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;

    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {
        /* ignore */
      }
    });
    markersRef.current.clear();

    locations.forEach((loc, i) => {
      const active = loc.id === selectedId;
      try {
        const marker = L.marker([loc.lat, loc.lng], {
          icon: pinIcon(i + 1, active),
          zIndexOffset: active ? 1000 : 0,
        }).addTo(map);
        marker.on("click", () => onSelect?.(loc.id));
        markersRef.current.set(loc.id, marker);
      } catch {
        /* map torn down mid-update */
      }
    });

    if (!didFitBoundsRef.current && locations.length > 1) {
      didFitBoundsRef.current = true;
      try {
        const bounds = L.latLngBounds(
          locations.map((loc) => [loc.lat, loc.lng] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
      } catch {
        /* map torn down mid-update */
      }
    }
  }, [mapEpoch, locations, selectedId, onSelect]);

  // Origin marker, in its own layer group. It is removed and redrawn on every
  // change and on unmount, and it leaves the branch pins alone.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map)) return;
    if (!origin) return;

    const group = L.layerGroup();
    try {
      if (origin) {
        // Blue "my location" dot, the same idea as Google Maps.
        L.marker([origin.lat, origin.lng], {
          icon: L.divIcon({
            className: "",
            html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#2F80FF;border:3px solid #FFFFFF;box-shadow:0 0 0 8px rgba(47,128,255,0.25),0 2px 6px rgba(0,0,0,0.4)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(group);
      }
      group.addTo(map);
    } catch {
      /* map torn down mid-update */
    }

    return () => {
      try {
        group.remove();
      } catch {
        /* already removed */
      }
    };
  }, [mapEpoch, origin]);

  // A tap on empty map sets the start point. Branch pins stop their own clicks.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapAlive(map) || !onPickOrigin) return;

    const handleClick = (event: L.LeafletMouseEvent) => {
      onPickOrigin({ lat: event.latlng.lat, lng: event.latlng.lng });
    };
    map.on("click", handleClick);

    return () => {
      try {
        map.off("click", handleClick);
      } catch {
        /* map already removed */
      }
    };
  }, [mapEpoch, onPickOrigin]);

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

      {onLocate && (
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          aria-label="Show my location"
          title="Show my location"
          className="absolute end-3 bottom-3 z-[1000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1A1A1A] text-white shadow-lg transition-colors hover:bg-[#2A2A2A] disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      {directionsHref && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[1000] flex justify-center px-3">
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto cursor-pointer rounded-full bg-[#FF0931] px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            Directions
          </a>
        </div>
      )}

      <div className="pointer-events-none absolute top-2 end-2 z-[1000] text-[9px] leading-none text-white/45">
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
