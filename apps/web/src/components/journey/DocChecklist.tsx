'use client';

import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { listDocuments, deleteDocument, type DocumentItem, type UploadDocumentResponse } from '../../lib/api';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { DocumentCard } from '../documents/DocumentCard';
import { CheckCircleIcon, DocumentTextIcon } from '../common/Icons';
import type { JourneyState } from '@sahaj/shared';

export function DocChecklist() {
  const { checklist, journeyId } = useJourneyStore();
  const [uploadedDocs, setUploadedDocs] = useState<DocumentItem[]>([]);
  const [activeUploadDoc, setActiveUploadDoc] = useState<{ type: string; label: string } | null>(null);

  const fetchDocs = async () => {
    if (!journeyId) return;
    try {
      const docs = await listDocuments(journeyId);
      setUploadedDocs(docs);
    } catch {
      // Ignore in demo
    }
  };

  useEffect(() => {
    void fetchDocs();
  }, [journeyId]);

  const handleDelete = async (docId: string) => {
    if (!journeyId) return;
    try {
      const res = await deleteDocument(journeyId, docId);
      await fetchDocs();
      if (res.stateRevertedTo) {
        useJourneyStore.setState({ state: res.stateRevertedTo as JourneyState });
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleUploadSuccess = (result: UploadDocumentResponse) => {
    void fetchDocs();
    if (result.journeyStateUpdated) {
      useJourneyStore.setState({ state: result.journeyStateUpdated as JourneyState });
    }
  };

  // Map docType keys
  const docTypeMapping: Record<string, string> = {
    'doc-admission': 'admission_letter',
    'doc-income': 'income_proof',
    'doc-kyc': 'identity_proof',
  };

  // Default checklist items if none streamed yet
  const displayItems = checklist.length > 0 ? checklist : [
    { id: 'doc-admission', label: 'College Admission Letter / Fee Structure', mandatory: true, status: 'needed' as const },
    { id: 'doc-income', label: 'Income Proof / Salary Slip', mandatory: true, status: 'needed' as const },
    { id: 'doc-kyc', label: 'KYC Document (Aadhaar / PAN Card)', mandatory: true, status: 'needed' as const },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Required Documents ({displayItems.length})
        </h3>
        <span className="text-[11px] text-[var(--color-leaf)] font-medium">Digital Verification</span>
      </div>

      {/* Checklist status items */}
      <div className="flex flex-col gap-2">
        {displayItems.map((item) => {
          const mappedType = docTypeMapping[item.id] ?? item.id;
          const uploaded = uploadedDocs.find((d) => d.docType === mappedType);
          const isVerified = uploaded?.status === 'verified';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <DocumentTextIcon className="w-4 h-4 text-[var(--color-slate)] shrink-0" />
                <span className="font-medium text-[var(--text-primary)] truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isVerified ? (
                  <span className="flex items-center gap-1 text-[var(--color-leaf)] font-medium text-[11px]">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveUploadDoc({ type: mappedType, label: item.label })}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-signal-cyan)]/10 text-[var(--color-signal-cyan)] hover:bg-[var(--color-signal-cyan)]/20 font-medium transition-colors"
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--border-default)]">
          <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)] tracking-wider">
            Uploaded Files ({uploadedDocs.length})
          </span>
          <div className="flex flex-col gap-2">
            {uploadedDocs.map((doc) => (
              <DocumentCard key={doc._id} document={doc} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {activeUploadDoc && journeyId && (
        <DocumentUploadModal
          journeyId={journeyId}
          docType={activeUploadDoc.type}
          docLabel={activeUploadDoc.label}
          onClose={() => setActiveUploadDoc(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
