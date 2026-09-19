'use client';

import React, { useState, useRef } from 'react';
import { uploadDocument, type UploadDocumentResponse } from '../../lib/api';
import { X, FileText, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';

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
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setProgress(60);
          const base64Content = (reader.result as string).split(',')[1];

          const res = await uploadDocument(journeyId, {
            docType,
            filename: file.name,
            mimeType: file.type || 'application/pdf',
            contentBase64: base64Content,
          });

          setProgress(100);
          setExtractionResult(res);
          onSuccess(res);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Upload failed');
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to read file for upload');
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    setFile(null);
    setError(null);
    setProgress(0);
    setExtractionResult(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-md p-5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] flex flex-col gap-4 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2.5">
          <div className="flex items-center gap-1.5 text-label">
            <FileText size={14} className="text-[var(--roll-brass)]" />
            <h3 id="upload-modal-title" className="font-semibold text-xs text-[var(--ink-navy)]">
              Document Audit Registry: {docLabel}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:text-[var(--ink-navy)] hover:bg-[var(--muted)] transition-colors"
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {error && (
          <div className="alert-card p-2 text-xs font-mono flex items-center gap-2">
            <AlertTriangle size={13} className="text-[var(--absent-red)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {extractionResult ? (
          /* Extraction Result View */
          <div className="flex flex-col gap-3 font-mono">
            <div className="flex items-center gap-2 text-[var(--present-green)] text-xs">
              <CheckCircle2 size={16} />
              <span className="font-bold">Extraction &amp; PII Redaction Complete</span>
            </div>

            {/* Masked Summary Card */}
            <div className="p-3 rounded-[4px] bg-[var(--ledger-paper)] border border-[var(--rule-line)] flex flex-col gap-2 text-xs">
              <span className="text-label text-[10px]">
                Audited Fields (Zero Raw PII Retained)
              </span>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                {Object.entries(extractionResult.extractedSummary).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-[var(--ink-navy)] text-[11px]">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {extractionResult.journeyStateUpdated && (
              <div className="p-2 rounded-[4px] bg-[var(--present-green)]/10 border border-[var(--present-green)]/30 text-[var(--present-green)] text-xs">
                Milestone updated to: {extractionResult.journeyStateUpdated}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 rounded-[4px] border border-[var(--rule-line)] bg-[var(--muted)] text-[var(--ink-navy)] text-xs hover:bg-[var(--rule-line)]/50 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* File Pick & Upload View */
          <div className="flex flex-col gap-3 font-mono">
            {/* Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[var(--rule-line)] hover:border-[var(--roll-brass)] rounded-[6px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[var(--ledger-paper)]"
            >
              <FileText size={24} className="text-[var(--muted-foreground)] mb-1.5" />
              <p className="text-xs font-medium text-[var(--ink-navy)]">
                {file ? file.name : 'Select or drag document to archive'}
              </p>
              <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                PDF, JPG, PNG (Max 10MB)
              </span>

              {file && (
                <span className="text-[11px] text-[var(--present-green)] mt-1.5 font-bold">
                  {(file.size / 1024).toFixed(1)} KB selected
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />

            {file && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--absent-red)] hover:underline"
                >
                  <Trash2 size={12} />
                  <span>Clear File</span>
                </button>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>Extracting &amp; Masking PII...</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--muted)] rounded-[2px] border border-[var(--rule-line)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--present-green)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons: Icon on LEFT, size 14, gap-1.5 */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-1.5 rounded-[4px] border border-[var(--rule-line)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex-1 py-1.5 rounded-[4px] bg-[var(--present-green)] hover:bg-[var(--present-green)]/90 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                <span>{isUploading ? 'Verifying...' : 'Upload & Verify'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
