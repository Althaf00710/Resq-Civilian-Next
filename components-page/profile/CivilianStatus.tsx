'use client';

import React, { useEffect } from 'react';
import { from, gql, useQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { GET_CIVILIAN_STATUS } from '@/graphql/Queries/civilianStatusQueries';
import { EmergencyToCivilian, EmergencyCategory, CivilianStatusItem, QueryData} from '@/graphql/types/civilianStatus';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
};

function IconRenderer({ icon, name }: { icon?: string | null; name: string }) {
  if (!icon) {
    return <span className="inline-block h-2 w-2 rounded-full bg-slate-400" aria-hidden />;
  }
  const isUrl = icon.startsWith('http') || icon.startsWith('/');
  if (isUrl) {
    return <img src={icon} alt={name} className="h-4 w-4 rounded-sm object-contain" />;
  }
  // Fallback: treat as emoji/short text
  return <span className="text-base leading-none">{icon}</span>;
}

export default function CivilianStatus({ open, onClose, title = 'Civilian Status' }: Props) {
  const { data, loading, error, refetch } = useQuery<QueryData>(GET_CIVILIAN_STATUS, {
    skip: !open,
    fetchPolicy: 'cache-and-network',
  });

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const statuses = data?.civilianStatuses ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="civilian-status-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Modal panel */}
      <div
        className="relative mx-3 mb-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/10 sm:mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="civilian-status-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Refresh"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Loading…</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              Failed to load statuses. {error.message}
            </div>
          )}

          {!loading && !error && statuses.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              No civilian statuses found.
            </div>
          )}

          <ul className="space-y-3">
            {statuses.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {s.role}
                </div>
                {s.description && (
                  <p className="mb-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {s.description}
                  </p>
                )}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Notified Emergency Categories
                  </p>
                  {s.emergencyToCivilians?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {s.emergencyToCivilians.map((et) => {
                        const cat = et.emergencyCategory;
                        if (!cat) return null;
                        return (
                          <span
                            key={et.emergencyCategoryId}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            title={cat.name}
                          >
                            <IconRenderer icon={cat.icon} name={cat.name} />
                            <span className="font-medium">{cat.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No categories configured.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
