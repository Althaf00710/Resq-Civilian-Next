'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, X, Loader2, Info } from 'lucide-react'

export default function SnakePredictModal({
  isOpen,
  onClose,
  onPredict,
  maxSizeMB = 8,
}: {
  isOpen: boolean
  onClose: () => void
  onPredict?: (file: File) => Promise<void> | void
  maxSizeMB?: number
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Focus trap: focus the dialog on open
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => dialogRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Revoke object URL when file changes/unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const accept = useMemo(() => ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/jpg'], [])
  const maxBytes = maxSizeMB * 1024 * 1024

  const validateFile = (f: File): string | null => {
    if (!accept.includes(f.type)) {
      return 'Unsupported file type. Please upload a JPG, PNG, WEBP, or HEIC image.'
    }
    if (f.size > maxBytes) {
      return `File is too large. Max size is ${maxSizeMB} MB.`
    }
    return null
  }

  // 🔁 Auto-submit after a valid file is chosen
  const handleSubmit = async (f: File) => {
    if (!onPredict) return
    try {
      setSubmitting(true)
      await onPredict(f)
    } catch (err: any) {
      setError(err?.message ?? 'Prediction failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const err = validateFile(f)
    if (err) {
      setError(err)
      setFile(null)
      setPreviewUrl(null)
      return
    }
    setError(null)
    setFile(f)
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    // 🚀 Auto predict here
    void handleSubmit(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile()
        if (f) handleFiles({ 0: f, length: 1, item: () => f } as unknown as FileList)
      }
    }
  }, [])

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !submitting) onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) onClose()
  }

  const triggerFilePicker = () => fileInputRef.current?.click()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
          onMouseDown={closeOnBackdrop}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="snake-predict-title"
            aria-describedby="snake-predict-desc"
            tabIndex={-1}
            ref={dialogRef}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <motion.div
              className="w-full max-w-xl rounded-2xl bg-gray-100 shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:text-neutral-100"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-neutral-200/70 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <img src="/images/snake.png" alt="Snake" className="h-7 w-7 rounded" />
                  <div>
                    <h2 id="snake-predict-title" className="text-lg font-semibold text-orange-400">Slytherin AI</h2>
                    <p id="snake-predict-desc" className="text-sm text-neutral-400 dark:text-neutral-400">
                      Upload a clear photo of the snake to predict its species.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={[
                    'relative grid gap-3 rounded-2xl border-2 border-dashed p-6 transition',
                    isDragging
                      ? 'border-green-500/70 bg-green-50 dark:bg-green-950/20'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                  ].join(' ')}
                >
                  {!previewUrl ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium">Drag & drop an image</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">Or</p>
                      <button
                        onClick={triggerFilePicker}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                      >
                        <ImageIcon className="h-4 w-4" /> Choose a file
                      </button>
                      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        JPG, PNG, WEBP, or HEIC up to {maxSizeMB} MB. You can also <span className="font-medium">paste</span> an image.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="relative overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Selected preview"
                          className="max-h-[48vh] w-full object-contain bg-neutral-50 dark:bg-neutral-800"
                        />
                        <button
                          onClick={() => {
                            setFile(null)
                            setPreviewUrl(null)
                            setError(null)
                          }}
                          disabled={submitting}
                          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/85 px-2 py-1 text-xs font-medium shadow hover:bg-white disabled:opacity-60 dark:bg-neutral-900/80"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                      {file && (
                        <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                          <div className="truncate"><span className="font-medium">File:</span> {file.name}</div>
                          <div><span className="font-medium">Size:</span> {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept.join(',')}
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {error && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    <Info className="mt-0.5 h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Predicting status */}
                {submitting && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Predicting…
                  </div>
                )}

                <div className="mt-4 space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <p>Tips for better predictions: ensure the snake is centered, in focus, and well-lit. Avoid blurry or distant shots.
                    <span className='text-orange-400'> Image will be stored for development purposes.</span></p>
                </div>
              </div>

              {/* Footer (Predict removed) */}
              {/* <div className="flex items-center justify-end gap-2 border-t border-neutral-200/70 p-4 dark:border-neutral-800">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 disabled:opacity-50 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                >
                  Close
                </button>
              </div> */}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
