import { describe, it, expect } from 'vitest';
import {
  BANNED_PROMISE_PHRASES,
  REQUIRED_DISCLAIMER,
  ESCALATION_TRIGGER_WORDS,
  findBannedPhrase,
  findEscalationTrigger,
} from '../guardrails.js';

describe('Guardrails & Responsible AI Rules', () => {
  describe('Banned promise phrases', () => {
    it('detects English guarantee & approval phrases', () => {
      expect(findBannedPhrase('Your loan is approved!')).toBe('approved');
      expect(findBannedPhrase('This is a guaranteed offer for you')).toBe('guaranteed');
      expect(findBannedPhrase('You are pre-approved for ₹2 Lakh')).toBe('pre-approved');
      expect(findBannedPhrase('You will get this loan definitely')).toBe('you will get');
      expect(findBannedPhrase('100% approval rate')).toBe('100%');
      expect(findBannedPhrase('The bank will approve your file')).toBe('will approve');
    });

    it('detects Hindi/Hinglish guarantee phrases', () => {
      expect(findBannedPhrase('Aapko yeh loan pakka milega')).toBe('pakka milega');
      expect(findBannedPhrase('Yeh guaranteed milega aapko')).toBe('guaranteed milega');
      expect(findBannedPhrase('Yeh rashi pakka approve ho jayegi')).toBe('pakka approve');
      expect(findBannedPhrase('यह ऋण पक्का मिलेगा')).toBe('पक्का मिलेगा');
      expect(findBannedPhrase('हमारी गारंटी है')).toBe('गारंटी');
    });

    it('returns null for compliant, objective informative text', () => {
      const safeText =
        'Based on typical eligibility criteria, applicants with your profile often explore Education Loan Option A. Illustrative EMI is ₹6,502.';
      expect(findBannedPhrase(safeText)).toBeNull();
    });
  });

  describe('Escalation trigger words', () => {
    it('detects fraud and legal dispute complaints in English', () => {
      expect(findEscalationTrigger('I was cheated by an agent')).toBe('cheated');
      expect(findEscalationTrigger('This looks like fraud')).toBe('fraud');
      expect(findEscalationTrigger('I want to file a legal complaint')).toBe('complaint');
      expect(findEscalationTrigger('I will go to police')).toBe('police');
    });

    it('detects distress/fraud words in Hindi and Hinglish', () => {
      expect(findEscalationTrigger('Mere sath dhoka hua hai')).toBe('dhoka');
      expect(findEscalationTrigger('Mujhe bohot pareshaan kiya ja raha hai')).toBe('pareshaan');
      expect(findEscalationTrigger('यह सरासर धोखा है')).toBe('धोखा');
      expect(findEscalationTrigger('मुझे कानूनी मदद चाहिए')).toBe('कानूनी');
    });

    it('returns null for normal financial inquiries', () => {
      expect(findEscalationTrigger('Can you explain what moratorium means?')).toBeNull();
      expect(findEscalationTrigger('Mujhe education loan chahiye')).toBeNull();
    });
  });

  describe('Required disclaimer', () => {
    it('contains placeholder tags for sources and assumptions in EN and HI', () => {
      expect(REQUIRED_DISCLAIMER.en).toContain('{source}');
      expect(REQUIRED_DISCLAIMER.en).toContain('{assumptions}');
      expect(REQUIRED_DISCLAIMER.en).toContain('Illustrative estimate');
      expect(REQUIRED_DISCLAIMER.hi).toContain('{source}');
      expect(REQUIRED_DISCLAIMER.hi).toContain('{assumptions}');
    });
  });
});
