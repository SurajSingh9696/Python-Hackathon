'use client';

import React, { useState } from 'react';
import type { DocumentItem } from '../../lib/api';
import { CheckCircle2, AlertTriangle, FileText, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentItem;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isVerified = document.status === 'verified';
  const isReviewNeeded = document.status === 'review_needed';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this document? Verification status will be reverted.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(document._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-2.5 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] flex flex-col gap-2 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-[var(--muted-foreground)] shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-[var(--ink-navy)] block truncate">
              {document.originalFilename ?? document.docType.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {new Date(document.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1 shrink-0">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-[var(--present-green)] text-[10px] px-2 py-0.5 rounded-[4px] border border-[var(--present-green)]/30 bg-[var(--present-green)]/10">
              <CheckCircle2 size={12} />
              <span>VERIFIED</span>
            </span>
          ) : isReviewNeeded ? (
            <span className="inline-flex items-center gap-1 text-[var(--absent-red)] text-[10px] px-2 py-0.5 rounded-[4px] border border-[var(--absent-red)]/30 bg-[var(--absent-red)]/10">
              <AlertTriangle size={12} />
              <span>REVIEW</span>
            </span>
          ) : (
            <span className="text-[var(--roll-brass)] text-[10px] animate-pulse">
              READING...
            </span>
          )}
        </div>
      </div>

      {/* Extracted Details Accordion */}
      {document.extractedFields && Object.keys(document.extractedFields).length > 0 && (
        <div className="border-t border-[var(--rule-line)] pt-1 mt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] text-[var(--roll-brass)] hover:underline inline-flex items-center gap-1"
          >
            <span>{showDetails ? 'Hide Masked Fields' : 'Show Masked Fields'}</span>
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-1.5 mt-1.5 p-2 rounded-[4px] bg-[var(--muted)]/20 border border-[var(--rule-line)]">
              {Object.entries(document.extractedFields).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[9px] text-[var(--muted-foreground)] uppercase">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-[10px] text-[var(--ink-navy)]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Action Button (Icon on left, Trash2, gap-1.5, size 13) */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--absent-red)] hover:underline disabled:opacity-50"
        >
          <Trash2 size={13} />
          <span>{isDeleting ? 'Deleting...' : 'Remove Record'}</span>
        </button>
      </div>
    </div>
  );
}
