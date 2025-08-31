'use client'

import Image from 'next/image'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import React from 'react'

type Props = {
  title?: string
  imageSrc?: string
  imageAlt?: string
  className?: string
}

export default function KnowVenomSection({
  title = 'Know Venomous or Non-venomous',
  imageSrc = '/images/snakeBite.jpg',
  imageAlt = 'Comparison of venomous vs non-venomous snake bites and heads',
  className = '',
}: Props) {
  return (
    <section className={`relative bg-blue-50 dark:bg-neutral-900 ${className}`}>
      <div className="container mx-auto px-6 py-12">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900 dark:text-white text-center">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Know </span>
          <span
            className="bg-clip-text text-transparent font-bold"
            style={{ backgroundImage: 'linear-gradient(135deg, hsl(38 100% 45%), hsl(40 75% 65%))' }}
          >
            Venomous
          </span>{' '}
          or <span className="bg-clip-text text-transparent font-bold" style={{ backgroundImage: 'linear-gradient(135deg, hsl(138 100% 40%), hsl(145 85% 65%))' }}>Non-venomous</span>
        </h2>

        {/* Content */}
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-2">
          {/* Left: info */}
          <div className="order-2 lg:order-1 space-y-5 ">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Quick visual cues can help then let a professional confirm. If bitten, treat it as
              potentially venomous until proven otherwise.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 border-l-3 border-l-blue-300">
              <li>
                <span className="font-bold text-blue-800">Bite marks:</span> Venomous bites often show{' '}
                <span className=" text-orange-400">two deep punctures</span>. Non-venomous typically
                leave a shallow curved row of small dots.
              </li>
              <li>
                <span className="font-bold text-blue-800">Local reaction:</span> Venomous bites may cause fast
                swelling, severe pain, and discoloration; non-venomous are usually milder.
              </li>
              <li>
                <span className="font-bold text-blue-800">Head/eyes:</span> Many (not all) venomous species
                have broader, triangular heads; pupils can vary by species, don’t rely on this alone.
              </li>
            </ul>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Do */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold mb-2">
                  <CheckCircle2 className="h-5 w-5" /> Do
                </div>
                <ul className="list-disc pl-5 text-sm text-emerald-900/90 dark:text-emerald-100/90 space-y-1">
                  <li>Keep the victim calm and still; immobilize the limb.</li>
                  <li>Remove rings/watches, swelling can trap them.</li>
                  <li>Get to a hospital quickly for assessment/antivenom if needed.</li>
                </ul>
              </div>

              {/* Don't */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold mb-2">
                  <AlertTriangle className="h-5 w-5" /> Don’t
                </div>
                <ul className="list-disc pl-5 text-sm text-rose-900/90 dark:text-rose-100/90 space-y-1">
                  <li>Do not cut, suck, or ice the wound.</li>
                  <li>Do not apply tight tourniquets.</li>
                  <li>Do not attempt to catch the snake, take a photo only if safe.</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ Always seek medical care after any snake bite. Identification can be tricky. Even
              experts confirm with multiple signs.
            </p>
          </div>

          {/* Right: image */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority={false}
                className="object-contain rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 bg-white/40 dark:bg-neutral-900/40"
                sizes="(max-width: 1024px) 100vw, 520px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
