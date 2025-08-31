'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

type LatLngLiteral = google.maps.LatLngLiteral;
type Picked = LatLngLiteral & { address?: string | null };

type VehicleMarker = {
  id: string | number;
  lat: number;
  lng: number;
  label?: string;       // e.g. vehicle code
  color?: string;       // marker color
};

type MapProps = {
  onChange?: (coords: Picked) => void;
  defaultZoom?: number;
  className?: string;
  initialCenter?: LatLngLiteral;
  vehicleMarker?: VehicleMarker | null; 
};

function makeSvgPin(color = '#0ea5e9', label?: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24'>
       <path fill='${color}' d='M12 2c-3.3 0-6 2.7-6 6c0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6z'/>
       <circle cx='12' cy='8.5' r='2.5' fill='white'/>
       ${label ? `<text x='12' y='22' text-anchor='middle' font-size='8' fill='white' font-family='sans-serif' font-weight='700'>${label}</text>` : ''}
     </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

// Classic loader with callback
const GOOGLE_SRC = (key: string) =>
  `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=places&callback=__initGMap`;

function loadGoogle(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any)._gmapsReady) return Promise.resolve();
  if (document.getElementById('google-maps-js')) return (window as any)._gmapsPromise;

  const script = document.createElement('script');
  script.id = 'google-maps-js';
  script.async = true;
  script.defer = true;
  script.src = GOOGLE_SRC(key);

  (window as any)._gmapsPromise = new Promise<void>((resolve, reject) => {
    (window as any).__initGMap = () => {
      (window as any)._gmapsReady = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
  });

  document.head.appendChild(script);
  return (window as any)._gmapsPromise;
}

export default function Map({
  onChange,
  defaultZoom = 15,
  className = '',
  initialCenter,
  vehicleMarker,           
}: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const markerRef = useRef<google.maps.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const geocodeTimerRef = useRef<number | null>(null);
  const lastLLRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  const [ready, setReady] = useState(false);
  const [bootCenter, setBootCenter] = useState<LatLngLiteral | null>(initialCenter ?? null);
  const [selected, setSelected] = useState<Picked | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initial geolocation to find a boot center
  useEffect(() => {
    if (bootCenter || typeof window === 'undefined') return;
    if (!('geolocation' in navigator)) {
      setBootCenter({ lat: 7.8731, lng: 80.7718 }); // Sri Lanka centroid fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setBootCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setBootCenter({ lat: 6.9271, lng: 79.8612 }), // Colombo fallback
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
  }, [bootCenter]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    if (!vehicleMarker) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    const pos = new google.maps.LatLng(vehicleMarker.lat, vehicleMarker.lng);
    const iconUrl = makeSvgPin(vehicleMarker.color ?? '#2563eb', vehicleMarker.label);

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position: pos,
        icon: { url: iconUrl, scaledSize: new google.maps.Size(44, 44) },
        optimized: true,
      });
    } else {
      markerRef.current.setPosition(pos);
      markerRef.current.setIcon({ url: iconUrl, scaledSize: new google.maps.Size(44, 44) });
    }
  }, [vehicleMarker]);
  
  // Load Maps script (classic)
  useEffect(() => {
    if (!apiKey) return;
    loadGoogle(apiKey).then(() => setReady(true)).catch(console.error);
  }, [apiKey]);

  // Init map + overlay + geocoder + listeners
  useEffect(() => {
    if (!ready || !bootCenter || !containerRef.current || mapRef.current) return;

    const container = containerRef.current;
    const map = new google.maps.Map(container, {
      center: bootCenter,
      zoom: defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    });
    mapRef.current = map;

    // Minimal overlay so we can do pixel<->latlng projection for the visual pin offset
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => {};
    overlay.draw = () => {};
    overlay.onRemove = () => {};
    overlay.setMap(map);
    overlayRef.current = overlay;

    geocoderRef.current = new google.maps.Geocoder();

    const reverseGeocode = async (ll: LatLngLiteral) => {
      try {
        const { results } = await geocoderRef.current!.geocode({ location: ll });
        return results?.[0]?.formatted_address ?? null;
      } catch {
        return null;
      }
    };

    // Compute the lat/lng under the fixed pin (falls back to center if projection isn't ready)
    const computeLLUnderPin = (): LatLngLiteral | null => {
      const center = map.getCenter();
      if (!center || !containerRef.current) return null;

      const proj = overlay.getProjection?.();
      if (!proj) {
        return center.toJSON(); // graceful fallback
      }

      const isLg = window.matchMedia('(min-width: 1024px)').matches;
      const percent = isLg ? 45 : 50;
      const x = (percent / 100) * containerRef.current.clientWidth;
      const y = containerRef.current.clientHeight / 2;
      const pixel = new google.maps.Point(x, y);
      const ll = proj.fromContainerPixelToLatLng(pixel);
      return ll ? ll.toJSON() : center.toJSON();
    };

    // Updater — called from multiple events
    const scheduleUpdate = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const ll = computeLLUnderPin();
        if (!ll) return;

        const key = `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`;

        // Update lat/lng immediately
        setSelected((prev) => {
          const prevKey = prev ? `${prev.lat.toFixed(6)},${prev.lng.toFixed(6)}` : '';
          if (prevKey === key) return prev;
          return { ...ll, address: null };
        });

        // Optional: Call onChange immediately without address (uncomment if needed)
        // onChangeRef.current?.({ ...ll, address: null });

        if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current);

        // Debounce geocode only
        geocodeTimerRef.current = window.setTimeout(async () => {
          if (lastLLRef.current === key) return;
          lastLLRef.current = key;

          const address = await reverseGeocode(ll);

          setSelected((prev) => {
            const prevKey = `${prev.lat.toFixed(6)},${prev.lng.toFixed(6)}`;
            if (prevKey !== key) return prev; // Position changed meanwhile; ignore old address
            return { ...prev, address };
          });

          // Call onChange only once address is ready (and if position hasn't changed)
          setSelected((prev) => { // Use functional update to get latest state
            const prevKey = `${prev.lat.toFixed(6)},${prev.lng.toFixed(6)}`;
            if (prevKey === key) {
              onChangeRef.current?.({ ...prev, address });
            }
            return prev;
          });
        }, 300);
      });
    };

    // Listen while the center moves (dragging) + zoom changes; also after tiles load
    const centerListener = map.addListener('center_changed', scheduleUpdate);
    const zoomListener = map.addListener('zoom_changed', scheduleUpdate);
    const tilesOnce = google.maps.event.addListenerOnce(map, 'tilesloaded', scheduleUpdate);

    // Recalculate when container size changes (rotation/split-screen)
    const ro = new ResizeObserver(() => scheduleUpdate());
    ro.observe(container);

    return () => {
      google.maps.event.removeListener(centerListener);
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(tilesOnce);
      ro.disconnect();

      if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      overlay.setMap(null);
    };
  }, [ready, bootCenter, defaultZoom]);

  // Recenter so the pin lands on the user's location (offset-aware)
  const recenterToMyLocation = useCallback(() => {
    if (!('geolocation' in navigator) || !mapRef.current || !containerRef.current || !overlayRef.current) return;

    const map = mapRef.current;
    const container = containerRef.current;
    const proj = overlayRef.current.getProjection();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const target = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);

        if (!proj) {
          map.panTo(target);
          return;
        }

        const isLg = window.matchMedia('(min-width: 1024px)').matches;
        const percent = isLg ? 45 : 50;
        const desiredX = (percent / 100) * container.clientWidth;
        const desiredY = container.clientHeight / 2;
        const desired = new google.maps.Point(desiredX, desiredY);

        const currentPixel = proj.fromLatLngToContainerPixel(target);
        if (!currentPixel) {
          map.panTo(target);
          return;
        }

        const dx = currentPixel.x - desired.x;
        const dy = currentPixel.y - desired.y;
        map.panBy(dx, dy);
      },
      (err) => console.warn('Geolocation failed', err),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 }
    );
  }, []);

  if (!apiKey) {
    return (
      <div
        className={`fixed inset-0 z-[300] grid place-items-center bg-neutral-50 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 ${className}`}
      >
        Missing <code className="font-mono">NEXT_PUBLIC_GOOGLE_API_KEY</code>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 w-screen h-[100dvh] ${className}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Fixed pin */}
      <div className="pointer-events-none absolute inset-0">
        {/* Center on mobile, shift left to 45% on lg+ (keep in sync with computeLLUnderPin) */}
        <div
          className="absolute top-1/2 left-1/2 lg:left-[45%] -translate-x-1/2 -translate-y-full"
          aria-hidden
        >
          <svg width="36" height="36" viewBox="0 0 24 24" className="drop-shadow">
            <path
              d="M12 2C8.7 2 6 4.7 6 8c0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5Z"
              className="fill-orange-500"
            />
          </svg>
          <div className="mx-auto mt-[-6px] h-2 w-2 rounded-full bg-orange-500/70" />
        </div>
      </div>

      {/* Controls */}
      <div
        className="pointer-events-none absolute left-3 top-3 flex gap-2"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          className="pointer-events-auto rounded-xl bg-white/90 px-3 py-2 text-xs font-medium shadow ring-1 ring-black/10 hover:bg-white dark:bg-neutral-900/90 dark:text-neutral-100 dark:ring-white/10"
          onClick={recenterToMyLocation}
          title="Use my current location"
        >
          Use my location
        </button>
      </div>

      {/* Selected coords + address */}
      {selected && (
        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[80vw] rounded-xl bg-white/85 px-3 py-1.5 text-[11px] shadow ring-1 ring-black/10 dark:bg-neutral-900/85 dark:text-neutral-100 dark:ring-white/10">
          <div>
            <span className="font-semibold">Selected:</span>{' '}
            {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
          </div>
          {selected.address ? <div className="truncate">{selected.address}</div> : null}
        </div>
      )}
    </div>
  );
}