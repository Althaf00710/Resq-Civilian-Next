'use client';
import Image from 'next/image';
import { Ambulance } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image + subtle dark overlay */}
      <Image
        src="/images/bg.jpg"
        alt=""               // decorative
        fill
        priority
        sizes="100vw"
        className="object-cover object-center pointer-events-none select-none"
        aria-hidden
      />
      <div className="absolute inset-0 bg-blue-900/60" aria-hidden />

      <div className="container mx-auto px-8 py-20 relative z-10 ml-5">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 flex justify-center lg:justify-start">
              <Image
                src="/images/Resq-white.png"
                alt="ResQ"
                width={180}
                height={50}
                priority
              />
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              Stay Safe.
              <br />
              <span className="text-orange-500">We&apos;re Here</span>
              <br />
              for You.
            </h1>

            <p className="mt-6 text-lg lg:text-2xl text-white/90">
              ResQ connects you to emergency responders instantly. Get help when you need it most
              with our reliable, fast emergency response system.
            </p>

            <div className="mt-10">
              <button
                className="inline-flex items-center gap-2 text-lg px-8 py-4 bg-orange-500 rounded-2xl text-white font-semibold shadow-lg hover:bg-orange-600 transition-colors cursor-pointer"
              >
                <Ambulance className="w-5 h-5" aria-hidden="true" />
                Request Help
              </button>
            </div>
          </div>

          {/* Right: image + floating stats */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Image
                src="/images/hero.jpg"
                alt="Emergency team helping civilians"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* 24/7 badge */}
            <div className="absolute -top-5 -left-5">
              <div className="rounded-full bg-white/80 px-4 py-5 shadow-xl border border-black/5 float-badge">
                <div className="text-2xl font-extrabold text-blue-800 glow-number">24/7</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>

            {/* Quick badge */}
            <div className="absolute -bottom-5 -right-5">
              <div className="rounded-full bg-white/80 px-4 py-7 shadow-xl border border-black/5 float-badge delay-700">
                <div className="text-2xl font-extrabold text-orange-500 glow-number">Quick</div>
                <div className="text-xs text-muted-foreground">Response</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div aria-hidden className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2" />
        </div>
      </div>

      {/* Local animations */}
      <style jsx global>{`
        @keyframes floatY {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
        .float-badge { animation: floatY 3s ease-in-out infinite alternate; }
        .float-badge.delay-700 { animation-delay: 0.7s; }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(255, 118, 46, 0)); }
          50% { filter: drop-shadow(0 0 10px rgba(255, 118, 46, 0.45)); }
        }
        .glow-number { animation: glow 2.2s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default Hero;
