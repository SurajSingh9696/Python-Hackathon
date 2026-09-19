import { describe, it, expect } from 'vitest';
import {
  LENDING_FIELDS,
  INSURANCE_FIELDS,
  getAllFields,
  getRequiredFields,
  getMissingFields,
  getNextQuestionField,
} from '../requiredFields.js';

describe('Required Fields & Question Logic', () => {
  it('defines the required core fields for lending', () => {
    const requiredLending = getRequiredFields('lending').map((f) => f.key);
    expect(requiredLending).toContain('purpose');
    expect(requiredLending).toContain('amount');
    expect(requiredLending).toContain('monthly_income');
    expect(requiredLending).toContain('existing_obligations_monthly');
    expect(requiredLending).not.toContain('tenure_months_pref');
    expect(requiredLending).not.toContain('employment_type');
  });

  it('defines the required core fields for insurance', () => {
    const requiredInsurance = getRequiredFields('insurance').map((f) => f.key);
    expect(requiredInsurance).toContain('insurance_type');
    expect(requiredInsurance).toContain('age_band');
    expect(requiredInsurance).toContain('members_to_cover');
    expect(requiredInsurance).not.toContain('coverage_pref');
    expect(requiredInsurance).not.toContain('pre_existing_conditions');
  });

  it('returns empty list for general domain', () => {
    expect(getRequiredFields('general')).toEqual([]);
    expect(getAllFields('general')).toEqual([]);
  });

  it('correctly calculates missing fields from an incomplete profile', () => {
    const profile = {
      purpose: 'education',
      amount: 200000,
    };
    const missing = getMissingFields('lending', profile).map((f) => f.key);
    expect(missing).toEqual(['monthly_income', 'existing_obligations_monthly']);
  });

  it('honors "Ask one minimal, highest-value question at a time"', () => {
    // Empty profile -> asks purpose first
    expect(getNextQuestionField('lending', {})?.key).toBe('purpose');

    // Has purpose -> asks amount
    expect(getNextQuestionField('lending', { purpose: 'education' })?.key).toBe('amount');

    // Has purpose & amount -> asks monthly income
    expect(
      getNextQuestionField('lending', { purpose: 'education', amount: 200000 })?.key
    ).toBe('monthly_income');

    // Complete profile -> returns null
    const complete = {
      purpose: 'education',
      amount: 200000,
      monthly_income: 50000,
      existing_obligations_monthly: 5000,
    };
    expect(getNextQuestionField('lending', complete)).toBeNull();
  });

  it('provides question prompts in English, Hindi, and Hinglish for all fields', () => {
    for (const f of [...LENDING_FIELDS, ...INSURANCE_FIELDS]) {
      expect(f.questionPrompt.en).toBeDefined();
      expect(f.questionPrompt.hi).toBeDefined();
      expect(f.questionPrompt.hinglish).toBeDefined();
    }
  });
});
