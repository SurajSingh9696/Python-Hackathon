'use client';

import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../stores/journeyStore';
import { listDocuments, deleteDocument, type DocumentItem, type UploadDocumentResponse } from '../../lib/api';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { DocumentCard } from '../documents/DocumentCard';
import { CheckCircle2, FileText, Plus } from 'lucide-react';
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
    <div className="flex flex-col gap-3 p-4 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)]">
      <div className="flex items-center justify-between border-b border-[var(--rule-line)] pb-2">
        <span className="text-label">
          Verification Checklist ({displayItems.length})
        </span>
        <span className="text-[11px] font-mono text-[var(--present-green)]">
          REGULATORY COMPLIANCE
        </span>
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-1.5">
        {displayItems.map((item) => {
          const mappedType = docTypeMapping[item.id] ?? item.id;
          const uploaded = uploadedDocs.find((d) => d.docType === mappedType);
          const isVerified = uploaded?.status === 'verified';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-[6px] bg-[var(--card)] border border-[var(--rule-line)] text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-[var(--muted-foreground)] shrink-0" />
                <span className="font-medium text-[var(--ink-navy)] truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[var(--present-green)] font-mono text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>VERIFIED</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveUploadDoc({ type: mappedType, label: item.label })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[var(--rule-line)] text-[var(--ink-navy)] hover:bg-[var(--muted)] font-mono text-[11px] transition-colors"
                  >
                    <Plus size={12} />
                    <span>Upload</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--rule-line)]">
          <span className="text-label">
            Audited Files ({uploadedDocs.length})
          </span>
          <div className="flex flex-col gap-1.5">
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
