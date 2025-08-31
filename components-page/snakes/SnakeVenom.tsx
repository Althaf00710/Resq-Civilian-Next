'use client'

import React from 'react'
import { Brain, Droplet, Activity, Syringe, AlertTriangle } from 'lucide-react'

type VenomKey = 'hemotoxic' | 'neurotoxic' | 'cytotoxic'

type VenomInfo = {
  key: VenomKey
  title: string
  badge: string
  description: string
  effects: string[]           // what it does
  antivenom: string           // short note on antivenom
  quickFacts: string[]        // “some datas”
  colors: {
    ring: string
    header: string
    pill: string
  }
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const VENOMS: VenomInfo[] = [
  {
    key: 'hemotoxic',
    title: 'Hemotoxic',
    badge: 'Blood & Tissue',
    description:
      'Primarily affects blood and local tissues. Can disrupt clotting and damage vessels and muscle around the bite.',
    effects: [
      'Painful swelling and bruising near the bite',
      'Bleeding/oozing; clotting problems may occur',
      'Can lead to low blood pressure and shock in severe cases',
    ],
    antivenom:
      'Treat in hospital. Use species-specific or regional polyvalent antivenom as directed by clinicians. Avoid home remedies.',
    quickFacts: [
      'Onset: minutes → hours',
      'Watch for rapid swelling',
      'Keep limb immobilized',
    ],
    colors: {
      ring: 'ring-red-300 dark:ring-red-700/60',
      header: 'from-rose-500 to-red-500',
      pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    },
    Icon: Droplet,
  },
  {
    key: 'neurotoxic',
    title: 'Neurotoxic',
    badge: 'Nerves & Breathing',
    description:
      'Targets the nervous system. Can block nerve signals to muscles and the diaphragm, risking breathing difficulty.',
    effects: [
      'Tingling, drooping eyelids, blurred vision',
      'Weakness, trouble speaking or swallowing',
      'Respiratory failure if severe',
    ],
    antivenom:
      'Urgent hospital care. Antivenom and airway/ventilation support as needed. Early treatment is critical.',
    quickFacts: [
      'Onset: often fast',
      'Monitor breathing',
      'Don’t delay transport',
    ],
    colors: {
      ring: 'ring-sky-300 dark:ring-sky-700/60',
      header: 'from-sky-500 to-blue-500',
      pill: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    },
    Icon: Brain,
  },
  {
    key: 'cytotoxic',
    title: 'Cytotoxic',
    badge: 'Local Tissue Damage',
    description:
      'Causes intense local cell damage around the bite. Swelling and blistering can progress to tissue necrosis.',
    effects: [
      'Severe localized pain and swelling',
      'Blistering; possible tissue breakdown',
      'Risk of secondary infection',
    ],
    antivenom:
      'Hospital evaluation. Antivenom when indicated, plus wound care and monitoring by clinicians.',
    quickFacts: [
      'Onset: minutes → hours',
      'Elevate (gentle) & immobilize',
      'No cutting/sucking/ice',
    ],
    colors: {
      ring: 'ring-amber-300 dark:ring-amber-700/60',
      header: 'from-amber-500 to-yellow-500',
      pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    },
    Icon: Activity,
  },
]

export default function SnakeVenom() {
  return (
    <section className="container mx-auto px-6 py-12">
      {/* Heading */}
      <div className="relative z-10 mb-8 text-center">
        <div className="inline-block">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white dark:text-white">
            Snake <span
            className="bg-clip-text text-transparent font-bold"
            style={{ backgroundImage: 'linear-gradient(135deg, hsl(239 100% 45%), hsl(245 75% 65%))' }}
          >Venom</span> Types
            </h2>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {VENOMS.map((v) => (
          <article
            key={v.key}
            className={`group relative overflow-hidden rounded-2xl bg-white/70 p-5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition hover:shadow-xl dark:bg-neutral-900/70 ${v.colors.ring}`}
          >
            {/* Gradient header bar */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${v.colors.header}`}
            />

            {/* Title row */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <v.Icon className="h-5 w-5 opacity-90" />
                <h3 className="text-lg font-semibold">{v.title}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${v.colors.pill}`}>
                {v.badge}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {v.description}
            </p>

            {/* Effects */}
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-semibold">What it does</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                {v.effects.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>

            {/* Antivenom note */}
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Syringe className="h-4 w-4" /> Antivenom
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">{v.antivenom}</p>
            </div>

            {/* Quick facts / “some datas” */}
            <div className="mt-4 flex flex-wrap gap-2">
              {v.quickFacts.map((q, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300"
                >
                  {q}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Safety note */}
      <div className="mt-6 inline-flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <p>
          Educational only — any bite should be assessed in a hospital. Immobilize the limb, keep
          the person calm, and avoid cutting, sucking, or using ice/tourniquets.
        </p>
      </div>
    </section>
  )
}
