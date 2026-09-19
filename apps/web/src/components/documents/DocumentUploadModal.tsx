'use client';

import React, { useState, useRef } from 'react';
import { uploadDocument, type UploadDocumentResponse } from '../../lib/api';
import { XMarkIcon, DocumentTextIcon, CheckCircleIcon, AlertTriangleIcon } from '../common/Icons';

interface DocumentUploadModalProps {
  journeyId: string;
  docType: string;
  docLabel: string;
  onClose: () => void;
  onSuccess: (result: UploadDocumentResponse) => void;
}

export function DocumentUploadModal({
  journeyId,
  docType,
  docLabel,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<UploadDocumentResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    setFile(selected);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(20);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setProgress(60);
          const base64Content = (reader.result as string).split(',')[1];

          const res = await uploadDocument(journeyId, {
            docType,
            filename: file.name,
            contentBase64: base64Content,
            mimeType: file.type,
          });

          setProgress(100);
          setExtractionResult(res);
          setIsUploading(false);
          onSuccess(res);
        } catch (err) {
          setIsUploading(false);
          setError((err as Error).message || 'Failed to upload and extract document');
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        setError('Error reading file. Please try again.');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploading(false);
      setError((err as Error).message);
    }
  };

  const handleRetry = () => {
    setFile(null);
    setExtractionResult(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl flex flex-col gap-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-[var(--color-signal-cyan)]" />
            <h3 id="upload-modal-title" className="font-semibold text-base text-[var(--text-primary)]">
              Upload {docLabel}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Extraction Success View */}
        {extractionResult ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[var(--color-leaf)] font-semibold text-sm">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Document verified & extracted</span>
            </div>

            {/* Masked Summary Card */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)] flex flex-col gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--text-secondary)] text-[10px]">
                Masked Extraction Summary (Zero Raw PII Stored)
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {Object.entries(extractionResult.extractedSummary).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[11px] text-[var(--text-secondary)] capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-[var(--text-primary)]">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {extractionResult.journeyStateUpdated && (
              <div className="p-3 rounded-xl bg-[var(--color-leaf)]/10 text-[var(--color-leaf)] text-xs font-semibold">
                ✓ All mandatory documents verified! Next milestone unlocked: {extractionResult.journeyStateUpdated}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white font-semibold text-sm hover:bg-[#009fd4] transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* File Pick & Upload View */
          <div className="flex flex-col gap-4">
            {/* Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--color-signal-cyan)] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[var(--bg-surface-alt)]/50"
            >
              <DocumentTextIcon className="w-8 h-8 text-[var(--color-slate)] mb-2" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {file ? file.name : 'Click or drag file here to upload'}
              </p>
              <span className="text-xs text-[var(--text-secondary)] mt-1">
                PDF, JPG, PNG (Max 10MB)
              </span>

              {file && (
                <span className="text-xs font-semibold text-[var(--color-signal-cyan)] mt-2">
                  {(file.size / 1024).toFixed(1)} KB selected
                </span>
              )}
            </div>

            {/* Hidden file & camera inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Camera trigger for mobile */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-2 rounded-xl border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors flex items-center justify-center gap-1.5"
              >
                <span>📷 Take Photo</span>
              </button>
              {file && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-2 rounded-xl text-xs text-[var(--color-rose)] hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Extracting & Masking PII...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-signal-cyan)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-[var(--text-primary)] font-semibold text-xs sm:text-sm hover:bg-[var(--border-default)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--color-signal-cyan)] text-white font-semibold text-xs sm:text-sm hover:bg-[#009fd4] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Verifying...' : 'Upload & Verify'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
