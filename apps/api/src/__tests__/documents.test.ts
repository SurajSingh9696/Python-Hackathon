/**
 * Documents & Checklist Unit and Integration Tests — Phase 7
 *
 * Tests:
 * 1. PII Masking: Aadhaar, PAN, and account numbers are properly masked before storage
 * 2. Document upload pipeline: admission and income documents transition to verified
 * 3. Journey state advancement: OPTIONS_READY -> DOCUMENTS_PENDING -> APPLICATION_GUIDANCE
 * 4. Document deletion & state reversal: deleting mandatory doc reverts state to DOCUMENTS_PENDING
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { maskAadhaar, maskPan, maskAccountNumber, maskExtractedRecord } from '../services/maskingService.js';
import { documentService } from '../services/documentService.js';
import { journeyRepo } from '../repositories/journeyRepository.js';

describe('Document Masking Service', () => {
  it('masks Aadhaar card number (only shows last 4 digits)', () => {
    const raw = 'My Aadhaar is 1234 5678 9012';
    expect(maskAadhaar(raw)).toBe('My Aadhaar is XXXX-XXXX-9012');
  });

  it('masks PAN number (preserves middle 4 digits)', () => {
    const raw = 'PAN ABCDE1234F provided';
    expect(maskPan(raw)).toBe('PAN XXXXX1234X provided');
  });

  it('masks bank account number (only shows last 4 digits)', () => {
    const raw = 'Account 123456789012 credited';
    expect(maskAccountNumber(raw)).toBe('Account XXXXXXXX9012 credited');
  });

  it('masks nested extracted records recursively', () => {
    const record = {
      applicant: {
        name: 'Rahul',
        pan: 'ABCDE5678G',
      },
      aadhaar: '9876 5432 1098',
    };
    const masked = maskExtractedRecord(record);
    // @ts-expect-error typed access
    expect(masked.applicant.pan).toBe('XXXXX5678X');
    expect(masked.aadhaar).toBe('XXXX-XXXX-1098');
  });
});

describe('Document Upload & Journey Progression', () => {
  let journeyId: string;
  const userId = 'user-test-doc-123';

  beforeEach(async () => {
    const j = await journeyRepo.create({ userId, domain: 'lending' });
    journeyId = j._id;
    // Set journey to OPTIONS_READY
    await journeyRepo.updateStateAndProfile(journeyId, userId, {
      state: 'OPTIONS_READY',
      profile: { amount: 200000, monthly_income: 35000 },
    });
  });

  it('processes admission letter upload and masks sensitive data', async () => {
    const res = await documentService.processUpload({
      journeyId,
      userId,
      docType: 'admission_letter',
      filename: 'admission_letter_dtu.pdf',
    });

    expect(res.status).toBe('verified');
    expect(res.extractedSummary['institution']).toBe('Delhi Technological University');
    expect(res.extractedSummary['feeTotal']).toBe('₹2,00,000 / year');
  });

  it('flags blurry or unclear document as review_needed', async () => {
    const res = await documentService.processUpload({
      journeyId,
      userId,
      docType: 'income_proof',
      filename: 'salary_slip_blurry.jpg',
    });

    expect(res.status).toBe('review_needed');
  });

  it('advances journey state to APPLICATION_GUIDANCE when both mandatory docs verified', async () => {
    // 1. Upload admission letter
    await documentService.processUpload({
      journeyId,
      userId,
      docType: 'admission_letter',
      filename: 'admission.pdf',
    });

    // 2. Upload income proof
    const res = await documentService.processUpload({
      journeyId,
      userId,
      docType: 'income_proof',
      filename: 'salary_slip.pdf',
    });

    expect(res.journeyStateUpdated).toBe('APPLICATION_GUIDANCE');

    const updatedJourney = await journeyRepo.getById(journeyId, userId);
    expect(updatedJourney.state).toBe('APPLICATION_GUIDANCE');
  });

  it('reverts journey state to DOCUMENTS_PENDING when a verified mandatory doc is deleted', async () => {
    // 1. Upload both docs to reach APPLICATION_GUIDANCE
    const adm = await documentService.processUpload({
      journeyId,
      userId,
      docType: 'admission_letter',
      filename: 'admission.pdf',
    });
    await documentService.processUpload({
      journeyId,
      userId,
      docType: 'income_proof',
      filename: 'salary_slip.pdf',
    });

    let current = await journeyRepo.getById(journeyId, userId);
    expect(current.state).toBe('APPLICATION_GUIDANCE');

    // 2. Delete admission letter
    const delRes = await documentService.deleteDocument(adm.docId, journeyId, userId);
    expect(delRes.success).toBe(true);
    expect(delRes.stateRevertedTo).toBe('DOCUMENTS_PENDING');

    current = await journeyRepo.getById(journeyId, userId);
    expect(current.state).toBe('DOCUMENTS_PENDING');
  });
});
