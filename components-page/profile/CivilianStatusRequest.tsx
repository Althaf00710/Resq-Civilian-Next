'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { X, UploadCloud, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GET_CIVILIAN_STATUS } from '@/graphql/Queries/civilianStatusQueries';
import { REQUEST_CIVILIAN_STATUS } from '@/graphql/mutations/civilianStatusMutations';
import { Icon } from '@iconify/react';

type EmergencyCategory = { icon?: string | null; name: string };
type EmergencyToCivilian = {
  emergencyCategoryId: number;
  emergencyCategory?: EmergencyCategory | null;
};
type CivilianStatusItem = {
  id: number;
  role: string;
  description?: string | null;
  emergencyToCivilians: EmergencyToCivilian[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (msg?: string) => void;
  /** LocalStorage key. You saved 'resq_civilian' */
  civilianIdKey?: string;
};

// coerce anything (number, numeric string) to number or null
function coerceId(val: unknown): number | null {
  const n = Number((val as any) ?? NaN);
  return Number.isFinite(n) ? n : null;
}

const isCivilian = (role?: string | null) =>
  typeof role === 'string' && role.trim().toLowerCase() === 'civilian';

export default function CivilianStatusRequest({
  open,
  onClose,
  onSuccess,
  civilianIdKey = 'resq_civilian',
}: Props) {
  const { data, loading, error, refetch } = useQuery<{ civilianStatuses: CivilianStatusItem[] }>(
    GET_CIVILIAN_STATUS,
    { skip: !open, fetchPolicy: 'cache-and-network' }
  );

  const [requestStatus, { loading: submitting }] = useMutation(REQUEST_CIVILIAN_STATUS);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok?: boolean; msg?: string } | null>(null);

  // Get civilianId from localStorage (accepts number, numeric string, JSON with id/civilianId/userId)
  const civilianId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(civilianIdKey);
    if (!raw) return null;

    try {
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const obj = JSON.parse(trimmed);
        return (
          coerceId(obj?.id) ??
          coerceId(obj?.civilianId) ??
          coerceId(obj?.userId) ??
          coerceId(obj?.user?.id) ??
          null
        );
      }
      return coerceId(trimmed);
    } catch {
      return null;
    }
  }, [civilianIdKey]);

  // ESC to close + lock scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Preview URL lifecycle
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const statuses = data?.civilianStatuses ?? [];
  const canSubmit = !!civilianId && !!selectedId && !!file && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setFeedback(null);
    try {
      const res = await requestStatus({
        variables: {
          input: { civilianId: civilianId as number, civilianStatusId: selectedId },
          proofPicture: file,
        },
      });
      const ok = res?.data?.createCivilianStatusRequest?.success;
      const msg = res?.data?.createCivilianStatusRequest?.message || '';
      setFeedback({ ok, msg });
      if (ok) {
        onSuccess?.(msg);
        setSelectedId(null);
        setFile(null);
        onClose();
      }
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message ?? 'Request failed' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="civ-status-req-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative mx-3 mb-4 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/10 sm:mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="civ-status-req-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Request Civilian Status
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
        <div className="max-h-[72vh] overflow-y-auto px-5 pb-5">
          {/* Civ ID status */}
          {!civilianId && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                Couldn’t find <code>{civilianIdKey}</code> in localStorage (expects a number or JSON with{' '}
                <code>id</code>/<code>civilianId</code>). Please set it before requesting.
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Loading statuses…</span>
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              Failed to load statuses. {error.message}
            </div>
          )}

          {/* Status list */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {statuses
                .filter((s) => !isCivilian(s.role)) // ⬅️ hide "Civilian"
                .map((s) => (
                <label
                    key={s.id}
                    className={[
                    'group relative cursor-pointer rounded-2xl border p-4 backdrop-blur-sm transition',
                    selectedId === s.id
                        ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-900/30'
                        : 'border-slate-200 bg-white/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60',
                    ].join(' ')}
                >
                    <input
                    type="radio"
                    name="civilian-status"
                    className="peer sr-only"
                    checked={selectedId === s.id}
                    onChange={() => setSelectedId(s.id)}
                    />

                    <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.role}</div>
                    {selectedId === s.id ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <span className="h-4 w-4 rounded-full border border-slate-300 bg-white dark:border-slate-700" />
                    )}
                    </div>

                    {s.description && (
                    <p className="mb-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                        {s.description}
                    </p>
                    )}

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
                            <Icon icon={cat.icon} height={20} aria-label={cat.name} />
                            <span className="font-medium">{cat.name}</span>
                            </span>
                        );
                        })}
                    </div>
                    ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">None configured.</p>
                    )}
                </label>
                ))}
            </div>


          {/* Upload */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">Upload Proof (License / ID)</p>
            <label
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
              title="Upload an image file"
            >
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-slate-500" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-medium">{file ? file.name : 'Choose an image'}</div>
                  <div className="text-[11px]">PNG, JPG, JPEG • Please Upload a Clear Image</div>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {previewUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <img src={previewUrl} alt="Proof preview" className="max-h-56 w-full object-contain" />
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={[
                'mt-3 rounded-xl p-3 text-sm',
                feedback.ok
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200',
              ].join(' ')}
            >
              {feedback.msg || (feedback.ok ? 'Request submitted successfully.' : 'Request failed.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/20 bg-white/60 px-5 py-3 dark:border-white/10 dark:bg-slate-900/60">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold text-white',
              canSubmit ? 'bg-emerald-600 hover:bg-emerald-700' : 'cursor-not-allowed bg-emerald-400/60',
            ].join(' ')}
          >
            {submitting ? 'Requesting…' : 'Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
