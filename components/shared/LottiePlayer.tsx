// components/shared/LottiePlayer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type Props = {
  src: string;      // can be a CDN URL
  loop?: boolean;
  play?: boolean;
  className?: string;
};

export default function LottiePlayer({ src, loop = true, play = true, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !ref.current) return;
    // lottie is attached to window by the CDN script
    const lottie = (window as any)?.lottie;
    if (!lottie) return;

    animRef.current?.destroy();
    animRef.current = lottie.loadAnimation({
      container: ref.current!,
      path: src,
      renderer: 'svg',
      loop,
      autoplay: play,
    });

    return () => animRef.current?.destroy();
  }, [ready, src, loop, play]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={ref} className={className} />
    </>
  );
}
