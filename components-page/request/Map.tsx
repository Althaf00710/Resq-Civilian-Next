'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

type LatLngLiteral = google.maps.LatLngLiteral;
type Picked = LatLngLiteral & { address?: string | null };

type VehicleMarker = {
  id: string | number;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  iconUrl?: string;
};

type MapProps = {
  onChange?: (coords: Picked) => void;
  defaultZoom?: number;
  className?: string;
  initialCenter?: LatLngLiteral;
  vehicleMarker?: VehicleMarker | null;
  requestedLocation?: LatLngLiteral | null; // destination
  status?: string | null;
  /** NEW: whether the user is currently choosing a location */
  allowPicking?: boolean;                    // 👈 NEW
};

function makeSvgPin(color = '#2563eb', label?: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24'>
       <path fill='${color}' d='M12 2c-3.3 0-6 2.7-6 6c0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6z'/>
       <circle cx='12' cy='8.5' r='2.5' fill='white'/>
       ${label ? `<text x='12' y='22' text-anchor='middle' font-size='8' fill='white' font-family='sans-serif' font-weight='700'>${label}</text>` : ''}
     </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

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

// preload helper with fallback
function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export default function Map({
  onChange,
  defaultZoom = 15,
  className = '',
  initialCenter,
  vehicleMarker,
  requestedLocation,
  status,
  allowPicking = true, // 👈 default true
}: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  // DOM / GMap refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Markers
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const requestedMarkerRef = useRef<google.maps.Marker | null>(null); // 👈 NEW

  // Directions
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Debounce & callbacks
  const geocodeTimerRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastLLRef = useRef<string>('');
  const onChangeRef = useRef(onChange);
  const lastNotifyRef = useRef<string>('');

  // UI state
  const [ready, setReady] = useState(false);
  const [mapBooted, setMapBooted] = useState(false);
  const [bootCenter, setBootCenter] = useState<LatLngLiteral | null>(initialCenter ?? null);
  const [selected, setSelected] = useState<Picked | null>(null);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { if (!mapRef.current && initialCenter) setBootCenter(initialCenter); }, [initialCenter]);

  // Bootstrap user location (only matters pre-pick)
  useEffect(() => {
    if (bootCenter || typeof window === 'undefined') return;
    if (!('geolocation' in navigator)) {
      setBootCenter({ lat: 7.8731, lng: 80.7718 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setBootCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setBootCenter({ lat: 6.9271, lng: 79.8612 }),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
  }, [bootCenter]);

  // Load Google Maps
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

    const computeLLUnderPin = (): LatLngLiteral | null => {
      const center = map.getCenter();
      if (!center || !containerRef.current) return null;

      const proj = overlay.getProjection?.();
      if (!proj) return center.toJSON();

      const isLg = window.matchMedia('(min-width: 1024px)').matches;
      const percent = isLg ? 45 : 50;
      const x = (percent / 100) * containerRef.current.clientWidth;
      const y = containerRef.current.clientHeight / 2;
      const pixel = new google.maps.Point(x, y);
      const ll = proj.fromContainerPixelToLatLng(pixel);
      return ll ? ll.toJSON() : center.toJSON();
    };

    const scheduleUpdate = () => {
      if (!allowPicking) return; // 👈 do nothing when picking is disabled
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const ll = computeLLUnderPin();
        if (!ll) return;

        const key = `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`;
        setSelected((prev) => {
          const prevKey = prev ? `${prev.lat.toFixed(6)},${prev.lng.toFixed(6)}` : '';
          if (prevKey === key) return prev;
          return { ...ll, address: null };
        });

        if (geocodeTimerRef.current) window.clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = window.setTimeout(async () => {
          if (lastLLRef.current === key) return;
          lastLLRef.current = key;

          const address = await reverseGeocode(ll);
          setSelected((prev) => {
            const prevKey = prev ? `${prev.lat.toFixed(6)},${prev.lng.toFixed(6)}` : '';
            return prevKey === key ? { ...prev!, address } : prev;
          });
        }, 300);
      });
    };

    const centerListener = map.addListener('center_changed', scheduleUpdate);
    const zoomListener = map.addListener('zoom_changed', scheduleUpdate);
    const tilesOnce = google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
      scheduleUpdate();
      setMapBooted(true);
    });

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
  }, [ready, bootCenter, defaultZoom, allowPicking]); // 👈 re-evaluate when picking toggles

  // Notify parent after address is ready (only while picking)
  useEffect(() => {
    if (!allowPicking) return;             // 👈 block notifications after request
    if (!selected || !selected.address) return;
    const key = `${selected.lat.toFixed(6)},${selected.lng.toFixed(6)}`;
    if (lastNotifyRef.current === key) return;
    lastNotifyRef.current = key;
    onChangeRef.current?.(selected);
  }, [allowPicking, selected?.lat, selected?.lng, selected?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vehicle marker (with runtime fallback to /vehicle.png)
  useEffect(() => {
    if (!mapRef.current || !mapBooted) return;
    const map = mapRef.current;

    if (!vehicleMarker) {
      vehicleMarkerRef.current?.setMap(null);
      vehicleMarkerRef.current = null;
      return;
    }

    const pos = new google.maps.LatLng(vehicleMarker.lat, vehicleMarker.lng);
    const candidateIcon = vehicleMarker.iconUrl || makeSvgPin(vehicleMarker.color ?? '#2563eb', vehicleMarker.label);
    const fallbackIcon = '/vehicle.png';

    const applyIcon = (url: string) => {
      if (!vehicleMarkerRef.current) return;
      vehicleMarkerRef.current.setIcon({ url, scaledSize: new google.maps.Size(44, 44) });
    };

    const setMarker = async () => {
      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = new google.maps.Marker({
          map,
          position: pos,
          icon: { url: fallbackIcon, scaledSize: new google.maps.Size(44, 44) },
          optimized: true,
          title: vehicleMarker.label || 'Responder',
        });
      } else {
        vehicleMarkerRef.current.setPosition(pos);
      }

      const ok = await preloadImage(candidateIcon);
      applyIcon(ok ? candidateIcon : fallbackIcon);
    };

    setMarker();
  }, [
    vehicleMarker?.lat,
    vehicleMarker?.lng,
    vehicleMarker?.label,
    vehicleMarker?.iconUrl,
    vehicleMarker?.color,
    mapBooted,
  ]);

  // NEW: Requested location marker (show ONLY when picking is off)
  useEffect(() => {
    if (!mapRef.current || !mapBooted) return;

    if (!requestedLocation || allowPicking) {
      // hide requested marker while picking
      requestedMarkerRef.current?.setMap(null);
      requestedMarkerRef.current = null;
      return;
    }

    const map = mapRef.current;
    const pos = new google.maps.LatLng(requestedLocation.lat, requestedLocation.lng);
    const icon = makeSvgPin('#f97316'); // orange

    if (!requestedMarkerRef.current) {
      requestedMarkerRef.current = new google.maps.Marker({
        map,
        position: pos,
        icon: { url: icon, scaledSize: new google.maps.Size(44, 44) },
        title: 'Requested location',
      });
    } else {
      requestedMarkerRef.current.setPosition(pos);
      requestedMarkerRef.current.setIcon({ url: icon, scaledSize: new google.maps.Size(44, 44) });
    }
  }, [requestedLocation?.lat, requestedLocation?.lng, allowPicking, mapBooted]);

  // When picking turns off, center on requested location (once)
  const wasPickingRef = useRef<boolean>(allowPicking);
  useEffect(() => {
    if (!mapRef.current || !mapBooted) return;
    const justDisabled = wasPickingRef.current && !allowPicking;
    wasPickingRef.current = allowPicking;

    if (justDisabled && requestedLocation) {
      mapRef.current.panTo(new google.maps.LatLng(requestedLocation.lat, requestedLocation.lng));
    }
  }, [allowPicking, requestedLocation?.lat, requestedLocation?.lng, mapBooted]);

  // Directions helpers
  const directionsServiceRefInit = useCallback(() => {
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: false,
      });
      directionsRendererRef.current.setMap(mapRef.current);
    }
  }, []);

  const clearRoute = useCallback(() => {
    directionsRendererRef.current?.setMap(null);
    directionsRendererRef.current = null;
  }, []);

  const renderRoute = useCallback((origin: LatLngLiteral, destination: LatLngLiteral) => {
    if (!mapRef.current || !window.google?.maps) return;
    directionsServiceRefInit();
    directionsServiceRef.current!.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, s) => {
        if (s === 'OK' && result) {
          directionsRendererRef.current!.setDirections(result);
          const b = new window.google.maps.LatLngBounds();
          b.extend(origin);
          b.extend(destination);
          mapRef.current!.fitBounds(b, 64);
        } else {
          const b = new window.google.maps.LatLngBounds();
          b.extend(origin);
          b.extend(destination);
          mapRef.current!.fitBounds(b, 64);
        }
      }
    );
  }, [directionsServiceRefInit]);

  // Show route only when not searching and not terminal
  const showRoute = (() => {
    if (!vehicleMarker || !requestedLocation) return false;
    const st = (status || '').toLowerCase();
    if (st.includes('cancel') || st.includes('complete') || st.includes('search')) return false;
    return true;
  })();

  useEffect(() => {
    if (!mapRef.current || !mapBooted) return;
    if (showRoute && vehicleMarker && requestedLocation) {
      renderRoute(
        { lat: Number(vehicleMarker.lat), lng: Number(vehicleMarker.lng) },
        { lat: Number(requestedLocation.lat), lng: Number(requestedLocation.lng) }
      );
    } else {
      clearRoute();
    }
  }, [
    mapBooted,
    showRoute,
    vehicleMarker?.lat,
    vehicleMarker?.lng,
    requestedLocation?.lat,
    requestedLocation?.lng,
    renderRoute,
    clearRoute,
  ]);

  // If only vehicle marker exists, center on it
  useEffect(() => {
    if (!mapRef.current || !mapBooted) return;
    if (!showRoute && vehicleMarker && !requestedLocation) {
      mapRef.current.panTo(new google.maps.LatLng(vehicleMarker.lat, vehicleMarker.lng));
    }
  }, [mapBooted, showRoute, vehicleMarker?.lat, vehicleMarker?.lng, requestedLocation?.lat, requestedLocation?.lng]);

  // Recenter button (still available)
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
      <div className={`fixed inset-0 z-[300] grid place-items-center bg-neutral-50 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 ${className}`}>
        Missing <code className="font-mono">NEXT_PUBLIC_GOOGLE_API_KEY</code>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 w-screen h-[100dvh] ${className}`}>
      <div ref={containerRef} className="h-full w-full" />

      {/* Fixed pin (destination) — show ONLY while picking */}
      {allowPicking && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 lg:left-[45%] -translate-x-1/2 -translate-y-full" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" className="drop-shadow">
              <path
                d="M12 2C8.7 2 6 4.7 6 8c0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5a2.5 2.5 0 0 1 0 5Z"
                className="fill-orange-500"
              />
            </svg>
            <div className="mx-auto mt-[-6px] h-2 w-2 rounded-full bg-orange-500/70" />
          </div>
        </div>
      )}

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

      {/* Selected coords + address — show ONLY while picking */}
      {allowPicking && selected && (
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
