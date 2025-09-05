'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { HANDLE_CIVILIAN_LOCATION } from '@/graphql/mutations/civilianLocationMutations';
import { useAuth } from '@/context/AuthContext';

type Coords = { lat: number; lng: number };

const PING_MS = 5000;
const MIN_MOVE_METERS = 10;   // immediate send if moved >= 10m
const GEO_TIMEOUT_MS = 10000;
const GEO_MAX_AGE_MS = 5000;

const REV_GEOCODE_MIN_MOVE_M = 50;   // refresh address if moved >= 50m
const REV_GEOCODE_MIN_INTERVAL_MS = 60000; // or at least every 60s

function haversine(a: Coords, b: Coords) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function geolocateViaGoogle(): Promise<Coords | null> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key) return null;
    const resp = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ considerIp: true }),
      }
    );
    if (!resp.ok) return null;
    const json = await resp.json();
    const loc = json?.location;
    return (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number')
      ? { lat: loc.lat, lng: loc.lng }
      : null;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!key) return null;
    const resp = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
    );
    if (!resp.ok) return null;
    const json = await resp.json();
    const first = json?.results?.[0]?.formatted_address;
    return typeof first === 'string' && first.length ? first : null;
  } catch {
    return null;
  }
}

export default function LiveLocationPinger() {
  const { isLoggedIn, civilian } = useAuth();
  const [mutate] = useMutation(HANDLE_CIVILIAN_LOCATION, { fetchPolicy: 'no-cache' });

  const lastPosRef = useRef<Coords | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastAddrRef = useRef<string | null>(null);
  const lastGeocodeAtRef = useRef<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const shouldRun =
    isLoggedIn &&
    civilian &&
    Number.parseInt(String((civilian as any).civilianStatusId), 10) !== 1;

  useEffect(() => {
    if (!shouldRun) {
      if (watchIdRef.current && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const civilianId = Number.parseInt(String((civilian as any).id), 10);
    if (!Number.isFinite(civilianId)) return;

    const ensureAddress = async (pos: Coords): Promise<string> => {
      const now = Date.now();
      const prevPos = lastPosRef.current;
      const dist = prevPos ? haversine(prevPos, pos) : Infinity;
      const tooOld = now - lastGeocodeAtRef.current >= REV_GEOCODE_MIN_INTERVAL_MS;

      if (!lastAddrRef.current || dist >= REV_GEOCODE_MIN_MOVE_M || tooOld) {
        const addr = await reverseGeocode(pos.lat, pos.lng);
        if (addr) {
          lastAddrRef.current = addr;
          lastGeocodeAtRef.current = now;
        }
      }
      // Never return null to GraphQL; fall back to a non-null string
      return lastAddrRef.current ?? 'Unknown location';
    };

    const send = async (pos: Coords) => {
      lastPosRef.current = pos;
      lastSentAtRef.current = Date.now();
      try {
        const address = await ensureAddress(pos);
        await mutate({
          variables: {
            input: {
              civilianId,
              latitude: pos.lat,
              longitude: pos.lng,
              address, // <-- always a non-null string
            },
          },
        });
      } catch {
        // ignore; next cycle will try again
      }
    };

    const getOnce = async () => {
      let coords: Coords | null = null;

      if ('geolocation' in navigator) {
        coords = await new Promise<Coords | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), GEO_TIMEOUT_MS + 1000);
          navigator.geolocation.getCurrentPosition(
            (p) => {
              clearTimeout(timer);
              resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
            },
            () => {
              clearTimeout(timer);
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: GEO_TIMEOUT_MS,
              maximumAge: GEO_MAX_AGE_MS,
            }
          );
        });
      }

      if (!coords) coords = await geolocateViaGoogle();
      if (coords) await send(coords);
    };

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => {
          const current = { lat: p.coords.latitude, lng: p.coords.longitude };
          const prev = lastPosRef.current;
          if (!prev || haversine(prev, current) >= MIN_MOVE_METERS) {
            void send(current);
          } else {
            lastPosRef.current = current;
          }
        },
        async () => {
          const g = await geolocateViaGoogle();
          if (g) void send(g);
        },
        {
          enableHighAccuracy: true,
          timeout: GEO_TIMEOUT_MS,
          maximumAge: GEO_MAX_AGE_MS,
        }
      );
    }

    intervalRef.current = window.setInterval(async () => {
      const now = Date.now();
      if (now - lastSentAtRef.current < PING_MS) return;

      let pos = lastPosRef.current;
      if (!pos) pos = await geolocateViaGoogle();
      if (pos) await send(pos);
    }, PING_MS) as unknown as number;

    void getOnce();

    return () => {
      if (watchIdRef.current && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldRun, civilian, mutate]);

  return null;
}
