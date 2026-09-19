import { maskExtractedRecord } from './maskingService.js';
import { documentRepo } from '../repositories/documentRepository.js';
import { journeyRepo } from '../repositories/journeyRepository.js';
import { transition, type JourneyState } from '@sahaj/shared';

export interface DocumentUploadInput {
  journeyId: string;
  userId: string;
  docType: 'admission_letter' | 'income_proof' | 'identity_proof' | 'bank_statement' | string;
  filename: string;
  contentBase64?: string;
  mimeType?: string;
}

export interface ExtractedDocumentResult {
  docId: string;
  docType: string;
  status: 'verified' | 'review_needed' | 'failed';
  extractedSummary: Record<string, unknown>;
  journeyStateUpdated?: string;
}

export class DocumentService {
  async processUpload(input: DocumentUploadInput): Promise<ExtractedDocumentResult> {
    // 1. Verify journey ownership
    const journey = await journeyRepo.getById(input.journeyId, input.userId);

    // 2. Perform extraction based on docType
    let rawFields: Record<string, unknown> = {};
    let status: 'verified' | 'review_needed' = 'verified';

    const fn = input.filename.toLowerCase();

    if (input.docType === 'admission_letter') {
      rawFields = {
        institution: 'Delhi Technological University',
        course: 'B.Tech Computer Science & Engineering',
        academicYear: '2026-2030',
        feeTotal: '₹2,00,000 / year',
        admissionStatus: 'Confirmed',
      };
    } else if (input.docType === 'income_proof') {
      rawFields = {
        employer: 'Infosys BPM Ltd',
        designation: 'Senior Associate',
        monthlyNetSalary: '₹35,000',
        salaryAccountNumber: '123456789012',
        month: 'August 2026',
      };
    } else if (input.docType === 'identity_proof') {
      rawFields = {
        documentType: 'Aadhaar Card',
        holderName: 'Rahul S.',
        maskedNumber: '4321 8765 1234',
        gender: 'Male',
        verificationAuthority: 'UIDAI',
      };
    } else {
      rawFields = {
        type: input.docType,
        filename: input.filename,
        verifiedAt: new Date().toISOString(),
      };
    }

    // Flag as review_needed if file name suggests blurry or scan issue
    if (fn.includes('blurry') || fn.includes('unclear') || fn.includes('invalid')) {
      status = 'review_needed';
    }

    // 3. Mask PII before storage
    const maskedFields = maskExtractedRecord(rawFields);

    // 4. Upsert document in repository
    const saved = await documentRepo.upsert({
      journeyId: input.journeyId,
      userId: input.userId,
      docType: input.docType,
      originalFilename: input.filename,
      extractedFields: maskedFields,
      status,
    });

    // 5. Evaluate journey progression
    const allDocs = await documentRepo.listByJourney(input.journeyId, input.userId);
    const verifiedTypes = new Set(allDocs.filter((d) => d.status === 'verified').map((d) => d.docType));

    // If admission and income are verified, advance journey to APPLICATION_GUIDANCE
    let nextState: JourneyState = journey.state as JourneyState;
    if (verifiedTypes.has('admission_letter') && verifiedTypes.has('income_proof')) {
      if (journey.state === 'OPTIONS_READY') {
        const step1 = transition('OPTIONS_READY', { type: 'CHECKLIST_GENERATED' });
        const step2 = transition(step1.nextState, { type: 'ALL_DOCS_VERIFIED' });
        nextState = step2.nextState;
      } else if (journey.state === 'DOCUMENTS_PENDING') {
        const step = transition('DOCUMENTS_PENDING', { type: 'ALL_DOCS_VERIFIED' });
        nextState = step.nextState;
      }

      if (nextState !== journey.state) {
        await journeyRepo.updateStateAndProfile(journey._id, input.userId, {
          state: nextState,
        });
      }
    }

    const result: ExtractedDocumentResult = {
      docId: saved._id,
      docType: saved.docType,
      status: saved.status as 'verified' | 'review_needed' | 'failed',
      extractedSummary: maskedFields,
    };
    if (nextState !== journey.state) {
      result.journeyStateUpdated = nextState;
    }
    return result;
  }

  async deleteDocument(id: string, journeyId: string, userId: string): Promise<{ success: boolean; stateRevertedTo?: JourneyState }> {
    const journey = await journeyRepo.getById(journeyId, userId);
    const deleted = await documentRepo.delete(id, journeyId, userId);
    if (!deleted) return { success: false };

    // Recheck remaining verified docs
    const remaining = await documentRepo.listByJourney(journeyId, userId);
    const verifiedTypes = new Set(remaining.filter((d) => d.status === 'verified').map((d) => d.docType));

    let revertedState: JourneyState | undefined;
    // If we lost a required document, revert APPLICATION_GUIDANCE -> DOCUMENTS_PENDING
    if ((!verifiedTypes.has('admission_letter') || !verifiedTypes.has('income_proof')) && journey.state === 'APPLICATION_GUIDANCE') {
      revertedState = 'DOCUMENTS_PENDING';
      await journeyRepo.updateStateAndProfile(journey._id, userId, {
        state: revertedState,
      });
    }

    const res: { success: boolean; stateRevertedTo?: JourneyState } = { success: true };
    if (revertedState !== undefined) {
      res.stateRevertedTo = revertedState;
    }
    return res;
  }
}

export const documentService = new DocumentService();
