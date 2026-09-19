'use client';

import React, { useState } from 'react';
import type { DocumentItem } from '../../lib/api';
import { CheckCircleIcon, AlertTriangleIcon, DocumentTextIcon } from '../common/Icons';

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
    if (!confirm('Are you sure you want to remove this document? Your verification status will be updated.')) {
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
    <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)] flex flex-col gap-2 text-xs transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <DocumentTextIcon className="w-4 h-4 text-[var(--color-slate)] shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-[var(--text-primary)] block truncate">
              {document.originalFilename ?? document.docType.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Uploaded on {new Date(document.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1 shrink-0">
          {isVerified ? (
            <span className="flex items-center gap-1 text-[var(--color-leaf)] font-medium text-[11px] bg-[var(--color-leaf)]/10 px-2 py-0.5 rounded-full">
              <CheckCircleIcon className="w-3.5 h-3.5" /> Verified
            </span>
          ) : isReviewNeeded ? (
            <span className="flex items-center gap-1 text-[var(--color-saffron-thread)] font-medium text-[11px] bg-[var(--color-saffron-thread)]/10 px-2 py-0.5 rounded-full">
              <AlertTriangleIcon className="w-3.5 h-3.5" /> Review Needed
            </span>
          ) : (
            <span className="text-[var(--color-signal-cyan)] text-[11px] font-medium animate-pulse">
              Reading...
            </span>
          )}
        </div>
      </div>

      {/* Extracted Details Accordion */}
      {document.extractedFields && Object.keys(document.extractedFields).length > 0 && (
        <div className="border-t border-[var(--border-default)] pt-1.5 mt-1">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-[var(--color-signal-cyan)] hover:underline flex items-center gap-1 font-medium"
          >
            <span>{showDetails ? 'Hide' : 'View'} Masked Details</span>
            <span>{showDetails ? '▲' : '▼'}</span>
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-2 mt-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
              {Object.entries(document.extractedFields).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-secondary)] capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-mono text-[11px] text-[var(--text-primary)]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete / Re-upload action */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-[10px] text-[var(--color-rose)] hover:underline disabled:opacity-50"
        >
          {isDeleting ? 'Removing...' : 'Delete & Re-upload'}
        </button>
      </div>
    </div>
  );
}
