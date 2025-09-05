// components-page/request/RequestStatusModal.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Check, Clock } from 'lucide-react';
import Image from 'next/image';
import LottiePlayer from '@/components/shared/LottiePlayer';

export type RescueRequestStatus = {
  id: string | number;
  status: string;           // Searching | Dispatched | Arrived | Completed | Cancelled
  createdAt?: string | Date;
};

type VehicleInfo = {
  code?: string | null;
  plateNumber?: string | null;
  iconUrl?: string | null; // optional, defaults to /vehicle.png
};

type Props = {
  isOpen: boolean;
  data: RescueRequestStatus;
  vehicle?: VehicleInfo;              // ← NEW: pass { code, plateNumber, iconUrl? }
  allowClose?: boolean;
  onClose?: () => void;
  cancelRequest: () => void;
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

// const LOTTIE = {
//   searching:  'https://lottie.host/75ccbd6e-c8f8-4628-8383-20f67c2f2de3/EuD0fwa1fZ.json',
//   dispatched: 'https://lottie.host/e4d6e003-af62-4459-8ce5-5f6ec538f840/6vzYaIIzd6.json',
//   arrived:    'https://lottie.host/e05e5622-1030-4440-8e62-5ffdb1a5352a/kMBEu6Iawf.json',
//   completed:  'https://lottie.host/49ccd56b-55a6-40c0-b473-cd511c74aaec/fd0ROutyRs.json',
//   cancelled:  'https://lottie.host/aa9f4f58-ae56-44ed-a444-aa2dcc04cb01/aPJWcFy61y.json',
// };

const LOTTIE = {
  searching:  '/lottie/Searching.json',
  dispatched: '/lottie/Dispatched.json',
  arrived:    '/lottie/Arrived.json',
  completed:  '/lottie/Completed.json',
  cancelled:  '/lottie/Cancelled.json',
};

const isCancelable = (s?: string) => statusKey(s).includes('search');

const lottieForStatus = (s?: string) => {
  const k = statusKey(s);
  if (k.includes('cancel'))   return { src: LOTTIE.cancelled,  loop: false };
  if (k.includes('complete')) return { src: LOTTIE.completed,  loop: false };
  if (k.includes('arriv'))    return { src: LOTTIE.arrived,    loop: true  };
  if (k.includes('dispatch')) return { src: LOTTIE.dispatched, loop: true  };
  return { src: LOTTIE.searching, loop: true };
};

const steps = ['Requested', 'Searching', 'Dispatched', 'Arrived', 'Done'];

export default function RequestStatusModal({
  isOpen,
  data,
  vehicle,
  allowClose = false,
  onClose,
  cancelRequest,
}: Props) {
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
  const progressPct = Math.max(0, Math.min(100, (stage / (steps.length - 1)) * 100));
  const anim = lottieForStatus(data?.status);
  const lottieKey = `${(data?.status ?? '').toLowerCase()}::${anim.src}`;

  const notSearching = !/search/i.test(data?.status ?? '');
  const showVehicle = notSearching && (vehicle?.code || vehicle?.plateNumber);

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
        <div className="pointer-events-auto w-full sm:max-w-md lg:w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-2xl lg:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10">
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

          {/* Progress Bar + Steps */}
          <div className="px-5 pt-5">
            <div className="relative h-2 rounded-full bg-blue-100 dark:bg-neutral-800/70">
              <div
                className="absolute left-0 top-0 h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
              {/* Circles row */}
              <div className="absolute inset-0 -top-[9px] flex items-center justify-between p-2">
                {steps.map((_label, i) => {
                  const done = i <= stage;
                  return (
                    <div
                      key={`dot-${i}`}
                      className={[
                        'grid place-items-center h-10 w-10 mt-2 rounded-full border-2 text-white text-[10px]',
                        done ? 'bg-blue-500 border-blue-500' : 'bg-white border-blue-300 dark:bg-neutral-900',
                      ].join(' ')}
                    >
                      {done ? <Check className="h-3 w-3" /> : <span className="text-blue-500">•</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Terms (no icons) */}
            <div className="mt-4 grid grid-cols-5 gap-10">
              {steps.map((label, i) => {
                const active = i <= stage;
                return (
                  <div
                    key={label}
                    className={`text-center text-[12px] font-medium ${active ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-neutral-500'}`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lottie */}
          <div className="px-5 pt-4">
            <LottiePlayer
              key={lottieKey}
              src={anim.src}
              loop={anim.loop}
              play={true}
              className="mx-auto h-40 w-40"
            />
          </div>

          {/* Vehicle Assigned (shown when not Searching and data present) */}
          {showVehicle && (
            <div className="px-5 pt-2">
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 dark:bg-neutral-800/60 dark:ring-white/10">
                <Image
                  src={vehicle?.iconUrl || '/vehicle.png'}
                  alt="Vehicle"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <div className="text-sm leading-tight">
                  <div className="font-semibold">Vehicle Assigned</div>
                  <div className="text-xs text-neutral-700 dark:text-neutral-300">
                    Code: <span className="font-medium">{vehicle?.code ?? '—'}</span>
                    {'  '}•{'  '}
                    Plate: <span className="font-medium">{vehicle?.plateNumber ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          {createdText && (
            <div className="flex items-center gap-2 px-5 py-4 text-xs text-neutral-600 dark:text-neutral-400">
              <Clock className="h-4 w-4" />
              Created at {createdText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
