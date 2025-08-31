'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, Shield, Cross, Plus } from 'lucide-react';

type HeroProps = {
  onTry?: () => void; 
};

const Hero = ({ onTry }: HeroProps) => {
  return (
    <section className="relative overflow-hidden min-h-[60vh]">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(135deg, hsl(210 20% 98%), hsl(210 75% 45% / 0.05) 50%, hsl(145 65% 45% / 0.10))',
          }}
        />
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 animate-pulse-glow"
          style={{
            backgroundImage:
              'linear-gradient(45deg, hsl(210 75% 45% / 0.10), transparent 50%, hsl(0 75% 55% / 0.05))',
          }}
        />
        {/* Geometric blobs */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-20 left-10 w-32 h-32 rounded-full blur-xl animate-float"
            style={{
              backgroundImage:
                'linear-gradient(135deg, hsl(210 75% 45%), hsl(210 75% 65%))',
            }}
          />
          <div
            className="absolute top-40 right-20 w-24 h-24 rounded-full blur-lg animate-float-delayed"
            style={{
              backgroundImage:
                'linear-gradient(135deg, hsl(0 75% 55%), hsl(0 75% 65%))',
            }}
          />
        </div>
        {/* Icon pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/3 animate-drift text-[hsl(210_75%_45%)]">
            <Plus className="w-12 h-12" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-drift-slow text-[hsl(0,65%,45%)]">
            <Cross className="w-8 h-8" />
          </div>
          <div className="absolute bottom-1/3 left-1/2 animate-float text-[hsl(0_75%_55%)]">
            <Heart className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <div className="container px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 backdrop-blur-sm rounded-full px-6 py-3 text-sm font-medium shadow-[0_4px_20px_-4px_hsl(210_75%_45%_/_0.1)] border text-orange-500"
            >
              <Shield className="w-4 h-4 animate-pulse" />
              Find Snakes by Slytherin AI
            </div>

            <div className="flex justify-center mb-8">
              <Image
                src="/images/App_Logo.png"
                alt="ResQ"
                width={140}
                height={50}
                priority
              />
            </div>

            {/* Heading */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                <span className="text-gray-600 font-medium">Sri Lankan </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, hsl(210 75% 45%), hsl(210 75% 65%))',
                  }}
                >
                  Snakes
                </span>
              </h1>
              <p className="text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed text-[hsl(210_15%_45%)]">
                Your essential guide to identifying venomous snakes. Instantly predict species with AI for faster recognition and awareness.
              </p>
            </div>

            {/* Try Button */}
            <div className="flex items-center justify-center gap-3 text-sm lg:text-base text-[hsl(210_15%_45%)]">
              <button
                onClick={onTry}
                className="flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 transition cursor-pointer shadow-lg hover:shadow-xl"
              >
                <img 
                  src="/images/snake.png" 
                  alt="Snake Icon" 
                  className="w-5 h-5"
                />
                Try Slytherin AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Local animations */}
      <style jsx>{`
        @keyframes floatY { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
        .animate-float { animation: floatY 6s ease-in-out infinite alternate; }
        .animate-float-delayed { animation: floatY 6s ease-in-out infinite alternate; animation-delay: 1.2s; }

        @keyframes pulseGlow {
          0%,100% { filter: drop-shadow(0 0 0 hsla(210, 75%, 45%, 0)); }
          50% { filter: drop-shadow(0 0 18px hsla(210, 75%, 45%, 0.45)); }
        }
        .animate-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }

        @keyframes drift { 0% { transform: translateX(0) rotate(0deg); } 100% { transform: translateX(20px) rotate(3deg); } }
        .animate-drift { animation: drift 10s ease-in-out infinite alternate; }
        .animate-drift-slow { animation: drift 18s ease-in-out infinite alternate; }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInUp .6s both; }
      `}</style>
    </section>
  );
};

export default Hero;
