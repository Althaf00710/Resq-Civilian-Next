'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import SnakeCard from '@/components-page/snakes/SnakeCard'
import { SnakePrediction } from '@/graphql/types/snake'

type PredictedSnakeModalProps = {
  isOpen: boolean
  onClose: () => void
  prediction: SnakePrediction // { snake, prob (0..1) }
  showLabel?: boolean
}

/** Circular percentage ring with responsive sizing via CSS clamp */
function ProbRing({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const stroke = 10
  const size = 120
  const radius = (size - stroke) / 2

  const color = useMemo(() => {
    if (pct >= 85) return 'stroke-emerald-500'
    if (pct >= 60) return 'stroke-sky-500'
    if (pct >= 40) return 'stroke-amber-500'
    return 'stroke-rose-500'
  }, [pct])

  return (
    <div
      className="relative inline-block"
      style={{ width: 'clamp(88px, 28vw, 140px)', height: 'clamp(88px, 28vw, 140px)' }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          className={`${color} drop-shadow-sm`}
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: pct / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{pct}%</div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Confidence</div>
        </div>
      </div>
    </div>
  )
}

export default function PredictedSnake({
  isOpen,
  onClose,
  prediction,
  showLabel = true,
}: PredictedSnakeModalProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const percent = (prediction?.prob ?? 0) * 100

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => dialogRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [isOpen])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }
  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-[1px]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={closeOnBackdrop} aria-hidden
        >
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="predicted-snake-title"
            tabIndex={-1} ref={dialogRef} onKeyDown={onKeyDown}
            className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              className="
                w-[92vw] sm:w-[85vw] md:w-[70vw] lg:w-1/3 xl:w-1/4 2xl:w-[22%] min-w-[300px]
                max-h-[90dvh] overflow-y-auto
                rounded-t-2xl sm:rounded-2xl
                bg-gray-300/95 shadow-2xl ring-1 ring-black/5
                dark:bg-neutral-900 dark:text-neutral-100
              "
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-neutral-200/70 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  {showLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60">
                      Predicted
                    </span>
                  )}
                  <h2 id="predicted-snake-title" className="text-base font-semibold text-orange-400">Slytherin AI</h2>
                </div>
                <button
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5">
                <div className="grid gap-4 sm:gap-6 xl:grid-cols-[auto,1fr] items-start">
                  <div className="justify-self-center">
                    <ProbRing percent={percent} />
                  </div>
                  <div className="w-full max-w-md mx-auto xl:max-w-none">
                    <SnakeCard snake={prediction.snake} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
