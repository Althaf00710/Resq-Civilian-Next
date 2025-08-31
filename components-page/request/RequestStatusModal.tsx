// components-page/request/RequestStatusModal.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Check, Clock } from 'lucide-react';
import LottiePlayer from '@/components/shared/LottiePlayer';
import Image from 'next/image';

export type RescueRequestStatus = {
  id: string | number;
  status: string;           // Searching | Dispatched | Arrived | Completed | Cancelled
  createdAt?: string | Date;
  // cancelRequest?: () => void; // not needed inside data anymore
};

type Props = {
  isOpen: boolean;
  data: RescueRequestStatus;
  allowClose?: boolean;
  onClose?: () => void;
  cancelRequest: () => void; // <-- use the prop
};

const statusKey = (s?: string) => (s ?? '').toLowerCase();

const stepIndexFromStatus = (s?: string) => {
  const k = statusKey(s);
  if (k.includes('cancel')) return 4;
  if (k.includes('complete')) return 4;
  if (k.includes('arriv')) return 3;
  if (k.includes('dispatch')) return 2;
  if (k.includes('search')) return 1;
  return 0; // created
};

const LOTTIE = {
  searching: 'https://lottie.host/75ccbd6e-c8f8-4628-8383-20f67c2f2de3/EuD0fwa1fZ.json',
  dispatched: 'https://lottie.host/e4d6e003-af62-4459-8ce5-5f6ec538f840/6vzYaIIzd6.json',
  arrived: 'https://lottie.host/e05e5622-1030-4440-8e62-5ffdb1a5352a/kMBEu6Iawf.json',
  completed: 'https://lottie.host/49ccd56b-55a6-40c0-b473-cd511c74aaec/fd0ROutyRs.json',
  cancelled: 'https://lottie.host/aa9f4f58-ae56-44ed-a444-aa2dcc04cb01/aPJWcFy61y.json',
};

const isCancelable = (s?: string) => {
  const k = (s ?? '').toLowerCase();
  return k.includes('search') || k.includes('dispatch');
};

const lottieForStatus = (s?: string) => {
  const k = (s ?? '').toLowerCase();
  if (k.includes('cancel')) return { src: LOTTIE.cancelled, loop: false };
  if (k.includes('complete')) return { src: LOTTIE.completed, loop: false };
  if (k.includes('arriv')) return { src: LOTTIE.arrived, loop: true };
  if (k.includes('dispatch')) return { src: LOTTIE.dispatched, loop: true };
  return { src: LOTTIE.searching, loop: true };
};

const steps = ['Requested', 'Searching', 'Dispatched', 'Arrived', 'Done'];

export default function RequestStatusModal({ isOpen, data, allowClose = false, onClose, cancelRequest }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => dialogRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  const createdText = useMemo(() => {
    if (!data?.createdAt) return '';
    try {
      return new Date(data.createdAt).toLocaleString();
    } catch {
      return String(data.createdAt);
    }
  }, [data]);

  if (!isOpen) return null;

  const stage = stepIndexFromStatus(data?.status);
  const anim = lottieForStatus(data?.status);

  return (
    <div className="fixed inset-0 z-[350] pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-status-title"
        tabIndex={-1}
        ref={dialogRef}
        className="fixed inset-0 z-[351] flex items-end justify-center p-3 lg:items-center lg:justify-end lg:p-6 pointer-events-none"
      >
        <div className="pointer-events-auto w-full sm:max-w-md lg:w-[440px] max-h-[90dvh] overflow-y-auto rounded-t-2xl lg:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200/70 p-4 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-800/50">
            <div className="flex items-center gap-2">
              <Image src="/images/App_Logo.png" alt="ResQ logo" width={50} height={50} className="block dark:hidden" priority />
              <Image src="/images/Resq-white.png" alt="ResQ logo (dark)" width={50} height={50} className="hidden dark:block" priority />
              <h2 id="req-status-title" className="text-base font-semibold">Request Status</h2>
            </div>

            {isCancelable(data?.status) && (
              <button
                onClick={cancelRequest}
                className="p-1 text-sm font-semibold text-red-500 hover:text-red-700"
                aria-label="Cancel request"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Stepper */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between">
              {steps.map((label, i) => {
                const active = i <= stage;
                const current = i === stage;
                return (
                  <div key={label} className="flex-1 flex flex-col items-center">
                    <div
                      className={[
                        'grid place-items-center h-8 w-8 rounded-full border-2',
                        active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-500 border-blue-300 dark:bg-neutral-900',
                      ].join(' ')}
                    >
                      {active && !current ? <Check className="h-4 w-4" /> : <span className="text-[12px] font-bold">{i + 1}</span>}
                    </div>
                    <div className="h-1 w-full">
                      {i < steps.length - 1 && <div className={`h-[2px] mx-1 ${i < stage ? 'bg-blue-400' : 'bg-blue-200 dark:bg-neutral-700'}`} />}
                    </div>
                    <div className={`mt-1 text-[11px] ${active ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-neutral-500'}`}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lottie */}
          <div className="px-5 pt-2">
            <LottiePlayer src={anim.src} loop={anim.loop} className="mx-auto h-40 w-40" />
          </div>

          {/* Meta */}
          {createdText && (
            <div className="flex items-center gap-2 px-5 pb-4 text-xs text-neutral-600 dark:text-neutral-400">
              <Clock className="h-4 w-4" />
              Created at {createdText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
