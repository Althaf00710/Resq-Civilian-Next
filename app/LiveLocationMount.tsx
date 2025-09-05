'use client';

// import the actual pinger (your path may differ)
import LiveLocationPinger from '@/components-page/LiveLocationPinger';

export default function LiveLocationMount() {
  // runs on the client only
  return <LiveLocationPinger />;
}
