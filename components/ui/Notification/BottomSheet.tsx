'use client';

import { useEffect, useRef } from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function BottomSheet({ open, onClose, title, children, className = '' }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // lock scroll when open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // focus panel on open
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={[
        'fixed inset-0 z-[1500]',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      ].join(' ')}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'absolute inset-0 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        tabIndex={-1}
        ref={panelRef}
        className={[
          'absolute bottom-0 inset-x-0',                             // mobile: full width
          'md:left-1/2 md:right-auto md:-translate-x-1/2',           // desktop: centered
          'w-full md:w-[min(640px,calc(100vw-2rem))]',               // desktop: compact width (≈ nav)
          'rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5',
          'dark:bg-slate-900 dark:ring-white/10',
          'transition-transform duration-300',
          open ? 'translate-y-0' : 'translate-y-full',
          className,
        ].join(' ')}
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="mx-auto h-1 w-10 -translate-y-2 rounded-full bg-slate-300/80 dark:bg-slate-600/80"
          aria-hidden
        />
        {title && (
          <div className="px-4 pt-2 pb-3">
            <h2 id="bottom-sheet-title" className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
          </div>
        )}
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
