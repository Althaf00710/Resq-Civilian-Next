// components-page/emergency/EmergencyRequestModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Image as ImageIcon, Car } from "lucide-react";
import { Icon } from "@iconify/react";
import type { EmergencyCategory } from "@/graphql/types/emergencyCategory";
import type { EmergencySubCategory } from "@/graphql/types/emergencySubCategory";

export type EmergencyRequestPayload = {
  emergencyCategoryId: string;
  emergencySubCategoryId: string;
  description: string;
  proofImage?: File | null;
};

type Props = {
  categories: EmergencyCategory[];
  onSubmit?: (payload: EmergencyRequestPayload) => Promise<void> | void;
  initialCategoryId?: string;
  initialSubCategoryId?: string;
};

const noScrollbar = "[-ms-overflow-style:none] [scrollbar-width:none]";
const noScrollbarCss: React.CSSProperties = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

export default function EmergencyRequestModal({
  categories,
  onSubmit,
  initialCategoryId,
  initialSubCategoryId,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId ?? null
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | null
  >(initialSubCategoryId ?? null);
  const [description, setDescription] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setSelectedSubCategoryId(null);
      return;
    }
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat && cat.emergencySubCategories?.length) {
      const stillValid = cat.emergencySubCategories.some(
        (s) => s.id === selectedSubCategoryId
      );
      if (!stillValid) setSelectedSubCategoryId(null);
    } else {
      setSelectedSubCategoryId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, categories]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const activeSub = useMemo(
    () =>
      activeCategory?.emergencySubCategories?.find(
        (s) => s.id === selectedSubCategoryId
      ) ?? null,
    [activeCategory, selectedSubCategoryId]
  );

  const canSubmit = !!activeCategory && !!activeSub;

  const handlePickFile = (f: File | null) => {
    if (!f) {
      setProof(null);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setProof(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const handleSubmit = async () => {
    if (!activeCategory || !activeSub) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: EmergencyRequestPayload = {
        emergencyCategoryId: activeCategory.id,
        emergencySubCategoryId: activeSub.id,
        description: description.trim(),
        proofImage: proof ?? undefined,
      };
      await onSubmit?.(payload);
      // Soft reset
      setTimeout(() => {
        setSelectedCategoryId(initialCategoryId ?? null);
        setSelectedSubCategoryId(initialSubCategoryId ?? null);
        setDescription("");
        handlePickFile(null);
      }, 0);
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emg-title"
        tabIndex={-1}
        ref={dialogRef}
        className="fixed inset-0 z-[301] flex items-end justify-center p-3 lg:items-center lg:justify-end lg:p-6 pointer-events-none"
      >
        {/* Panel: bottom sheet on phone, right-side middle on laptop */}
        <div className="relative isolate pointer-events-auto w-full sm:max-w-lg lg:w-[500px] max-h-[90dvh] overflow-y-auto rounded-t-2xl lg:rounded-2xl bg-white/90 dark:bg-neutral-900/20 supports-[backdrop-filter]:bg-white/75 backdrop-blur-xl backdrop-saturate-100 border border-white/30 dark:border-white/15 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200/70 p-4 dark:border-neutral-800">
            <div>
              <h2 id="emg-title" className="text-base font-semibold">
                Request Emergency Help
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Pick a category, then choose a subcategory. You can add a note
                and an optional photo.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-5">
            {/* Categories (horizontal scroll) */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Emergency Category
              </label>
              <div
                className={`relative -mx-1 flex snap-x gap-2 overflow-x-auto px-1 ${noScrollbar}`}
                style={noScrollbarCss}
              >
                {categories.map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedSubCategoryId(null);
                      }}
                      className={[
                        "snap-start whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset",
                        active
                          ? "bg-orange-500 text-white ring-orange-500"
                          : "bg-white text-neutral-800 ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700",
                      ].join(" ")}
                      aria-pressed={active}
                      title={cat.description ?? cat.name}
                    >
                      <span className="inline-flex items-center gap-2">
                        {cat.icon ? (
                          <Icon icon={cat.icon} className="h-4 w-4" />
                        ) : null}
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Category description (below selection) */}
              {activeCategory?.description ? (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {activeCategory.icon ? (
                      <Icon icon={activeCategory.icon} className="h-4 w-4" />
                    ) : null}
                    <span>{activeCategory.name}</span>
                  </div>
                  <p className="leading-relaxed">
                    {activeCategory.description}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Subcategory */}
            {activeCategory && (
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Subcategory</label>
                <div className="flex flex-wrap gap-2">
                  {activeCategory.emergencySubCategories?.map((s) => {
                    const active = selectedSubCategoryId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSubCategoryId(s.id)}
                        className={[
                          "rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset",
                          active
                            ? "bg-neutral-900 text-white ring-neutral-900 dark:bg-white dark:text-neutral-900 dark:ring-white"
                            : "bg-white text-neutral-800 ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-700",
                        ].join(" ")}
                        aria-pressed={active}
                        title={s.description ?? s.name}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory description (below selection) */}
                {activeSub?.description ? (
                  <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
                    <div className="font-semibold mb-1">{activeSub.name}</div>
                    <p className="leading-relaxed">{activeSub.description}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Description (optional note) */}
            {activeCategory && (
              <div className="grid gap-2">
                <label htmlFor="emg-desc" className="text-sm font-semibold">
                  Description
                </label>
                <textarea
                  id="emg-desc"
                  rows={4}
                  placeholder="What happened? Who is affected? Any immediate risks? (Optional)"
                  className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:placeholder:text-neutral-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Provide clear, concise details. Avoid sharing sensitive
                  personal info unless necessary.
                </p>
              </div>
            )}

            {/* Proof image (optional) */}
            {activeCategory && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Proof Image</label>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    JPG/PNG up to ~10MB
                  </span>
                </div>

                {!previewUrl ? (
                  <label className="group grid cursor-pointer place-items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:border-neutral-600">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) =>
                        handlePickFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 dark:text-neutral-300">
                        Upload or take a photo (Optional)
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Proof preview"
                      className="max-h-64 w-full object-contain bg-white dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow hover:bg-white dark:bg-neutral-900/90"
                      onClick={() => handlePickFile(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-neutral-200/70 p-4 dark:border-neutral-800">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Car className="h-4 w-4" />
              )}
              Request Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
