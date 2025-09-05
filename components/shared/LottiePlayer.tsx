// components/shared/LottiePlayer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;            // e.g. '/lottie/Dispatched.json' (must live under /public)
  loop?: boolean;
  play?: boolean;
  className?: string;     // make sure this sets explicit width/height
};

export default function LottiePlayer({
  src,
  loop = true,
  play = true,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<any>(null);
  const lottieRef = useRef<any>(null);      // lottie-web module
  const [json, setJson] = useState<any>(null);

  // 1) Load lottie-web once (ESM import, no <Script/> / window dependency)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (lottieRef.current) return;        // already loaded
      const mod = await import('lottie-web/build/player/lottie_light'); // lightweight renderer
      if (!cancelled) lottieRef.current = mod.default ?? mod;
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) Fetch JSON when src changes
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(src, { signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch ${src}`);
        const data = await res.json();
        if (!cancelled) setJson(data);
      } catch (_e) {
        if (!cancelled) setJson(null);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [src]);

  // 3) (Re)create animation when lib+json+container are ready
  useEffect(() => {
    const lottie = lottieRef.current;
    const el = containerRef.current;
    if (!lottie || !json || !el) return;

    // destroy any previous instance and clear DOM
    try { animRef.current?.destroy(); } catch {}
    el.innerHTML = '';

    animRef.current = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop,
      autoplay: !!play,
      animationData: json,
    });

    return () => {
      try { animRef.current?.destroy(); } catch {}
      animRef.current = null;
    };
  }, [json, loop]); // (re)build on new JSON or loop change

  // 4) Respond to play/pause changes without rebuilding
  useEffect(() => {
    const a = animRef.current;
    if (!a) return;
    if (play) a.goToAndPlay(0, true);
    else a.stop();
  }, [play]);

  return <div ref={containerRef} className={className} />;
}
