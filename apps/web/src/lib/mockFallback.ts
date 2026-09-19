/**
 * Client-Side Mock Fallback Layer — Full Multilingual + Full Conversation Flow
 *
 * Provides complete offline mock responses in English, Hindi, and Hinglish.
 * Supports the full user journey: Goal → Income → Products → Selection → Documents → Application.
 */
import type { SseEvent, LoanProduct } from '@sahaj/shared';
import type { Language } from './i18n';
import type {
  JourneyResponse,
  UploadDocumentResponse,
  DocumentItem,
  ReminderResponse,
  EscalateResponse,
  EscalationRecord,
  OutboxStatusResponse,
} from './api';

// ── In-Memory Stores ─────────────────────────────────────────────────────────
let mockDocs: DocumentItem[] = [
  {
    _id: 'doc-kyc-1',
    journeyId: 'mock-journey',
    userId: 'guest-user',
    docType: 'identity_proof',
    status: 'verified',
    originalFilename: 'Aadhaar_eKYC_Verified.pdf',
    extractedFields: {
      maskedAadhaar: 'XXXX-XXXX-9876',
      maskedPan: 'XXXXX1234X',
      verifiedDate: new Date().toLocaleDateString('en-IN'),
      redactionStatus: 'Compliant (Zero PII stored)',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockEscalationsList: EscalationRecord[] = [
  {
    _id: 'esc-init-1',
    journeyId: 'mock-journey',
    userId: 'guest-user',
    reason: 'Initial compliance and audit record registration',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function createMockJourney(
  initialMessage?: string,
  language: 'en' | 'hi' | 'hinglish' = 'hinglish'
): JourneyResponse {
  const isInsurance = initialMessage
    ? /insurance|bima|policy|health|aarogya/i.test(initialMessage)
    : false;
  return {
    _id: `mock-journey-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: 'guest-user',
    state: 'profile_building',
    domain: isInsurance ? 'insurance' : 'lending',
    language,
    profile: {
      amount: isInsurance ? 1000000 : 2500000,
      purpose: isInsurance ? 'health' : 'education',
      course: isInsurance ? undefined : 'MS in Computer Science',
      country: isInsurance ? undefined : 'USA / Germany',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getMockDocuments(): DocumentItem[] {
  return [...mockDocs];
}

export function getMockUploadResult(docType: string, filename: string): UploadDocumentResponse {
  const newDocId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const newDoc: DocumentItem = {
    _id: newDocId,
    journeyId: 'mock-journey',
    userId: 'guest-user',
    docType,
    status: 'verified',
    originalFilename: filename,
    extractedFields: {
      documentType: docType.replace(/_/g, ' ').toUpperCase(),
      fileName: filename,
      verificationStatus: 'Verified against Digilocker & Institution records',
      verifiedDate: new Date().toLocaleDateString('en-IN'),
      redactionStatus: 'Complete (Zero PII stored)',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const existingIdx = mockDocs.findIndex((d) => d.docType === docType);
  if (existingIdx >= 0) {
    mockDocs[existingIdx] = newDoc;
  } else {
    mockDocs.push(newDoc);
  }
  return {
    docId: newDocId,
    docType,
    status: 'verified',
    extractedSummary: newDoc.extractedFields ?? {},
    journeyStateUpdated: 'documents_in_review',
  };
}

export function removeMockDocument(docId: string): boolean {
  const initialLen = mockDocs.length;
  mockDocs = mockDocs.filter((d) => d._id !== docId && d.docType !== docId);
  return mockDocs.length < initialLen;
}

export function getMockReminderResponse(channel = 'whatsapp'): ReminderResponse {
  return {
    success: true,
    message: `Audit reminder scheduled via ${channel.toUpperCase()} (Institutional Outbox Queue).`,
    eventId: `evt-outbox-${Date.now()}`,
  };
}

export function getMockEscalationResponse(): EscalateResponse {
  const newEsc: EscalationRecord = {
    _id: `esc-${Date.now()}`,
    journeyId: 'mock-journey',
    userId: 'guest-user',
    reason: 'Assistance requested with priority loan underwriting & verification.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  mockEscalationsList.push(newEsc);
  return {
    success: true,
    escalationId: newEsc._id,
    outboxDeliveryId: `out-${Date.now()}`,
    message: 'Escalation ticket created. A senior credit officer has been assigned to your case.',
  };
}

export function getMockEscalations(): EscalationRecord[] {
  return [...mockEscalationsList];
}

export function getMockOutboxStatus(): OutboxStatusResponse {
  return {
    pending: 0,
    completed: mockEscalationsList.length + 2,
    failed: 0,
    total: mockEscalationsList.length + 2,
  };
}

export function getMockExplanation(term: string): { term: string; explanation: string; simpleAnalogy?: string } {
  const normalized = term.toLowerCase();
  if (normalized.includes('foir')) {
    return {
      term: 'FOIR (Fixed Obligation to Income Ratio)',
      explanation:
        'FOIR measures the percentage of your gross monthly income dedicated to servicing all debt EMIs. RBI prudential norms recommend keeping total FOIR below 50%.',
      simpleAnalogy:
        'Like an aircraft payload capacity — if 40% of cargo room is already used, you can safely add more up to the 50% structural limit.',
    };
  }
  if (normalized.includes('moratorium')) {
    return {
      term: 'Moratorium Period (Repayment Holiday)',
      explanation:
        'A statutory grace period during which borrowers are not obligated to pay full principal EMIs. For education loans, this covers the entire course plus 6–12 months post-graduation.',
      simpleAnalogy:
        'Like an investment runway — you are given time to complete your degree and start earning before full repayments begin.',
    };
  }
  return {
    term,
    explanation: `${term} is a standardized regulatory benchmark used by RBI and IRDAI-governed institutions to maintain transparency and fair underwriting standards.`,
    simpleAnalogy: 'A standardized gauge ensuring consumer protection and fair financial pricing.',
  };
}

// ── Financial Math ────────────────────────────────────────────────────────────
function calculateEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  const r = annualRatePct / (12 * 100);
  const f = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * f) / (f - 1));
}

// ── Language-aware text helpers ───────────────────────────────────────────────
function txt(lang: Language, en: string, hi: string, hinglish: string): string {
  if (lang === 'hi') return hi;
  if (lang === 'hinglish') return hinglish;
  return en;
}

// ── Main Mock Stream ──────────────────────────────────────────────────────────
export async function simulateMockStream(
  content: string,
  callbacks: {
    onEvent: (event: SseEvent) => void;
    onError?: (error: Error) => void;
    onDone?: () => void;
  },
  signal?: AbortSignal,
  language: Language = 'hinglish'
): Promise<void> {
  const lower = content.toLowerCase();

  const sleep = (ms: number) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Error('Aborted'));
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted'));
      });
    });

  const streamTokens = async (text: string) => {
    const chunks = text.split(/(\s+)/);
    for (const chunk of chunks) {
      if (signal?.aborted) return;
      callbacks.onEvent({ type: 'token', delta: chunk });
      await sleep(16);
    }
  };

  const done = (extra = {}) => {
    callbacks.onEvent({
      type: 'done',
      messageId: `msg-${Date.now()}`,
      timings: { totalMs: 400, ttftMs: 95, retrievalMs: 50, calcMs: 15, llmMs: 240 },
      ...extra,
    });
    callbacks.onDone?.();
  };

  try {
    // ── 0. Prompt Injection / Security Guard ─────────────────────────────────
    if (/system override|ignore previous|ignore all|jailbreak|reveal.*prompt|dan mode|100% guarantee|unconditional/i.test(lower)) {
      callbacks.onEvent({ type: 'status', stage: 'understanding', message: txt(language, 'Security Guard active...', 'सुरक्षा जांच हो रही है...', 'Security check ho raha hai...') });
      await sleep(200);

      const guardText = txt(
        language,
        '**[SECURITY COMPLIANCE GUARD TRIGGERED]**\n\n' +
          'Your input contained system override or jailbreak instructions. Under RBI Fair Practices and ISO 27001 compliance:\n\n' +
          '1. Internal system prompts and security keys cannot be extracted.\n' +
          '2. No loan or insurance product can be unconditionally guaranteed.\n' +
          '3. All recommendations are indicative and subject to institutional underwriting.\n\n' +
          '*Disclaimer: Sahaj is an AI-guided financial discovery engine. No approval is guaranteed without institutional KYC and credit assessment.*',
        '**[सुरक्षा अनुपालन जांच सक्रिय]**\n\n' +
          'आपके इनपुट में अनधिकृत सिस्टम निर्देश पाए गए। RBI फेयर प्रैक्टिस और ISO 27001 अनुपालन के अनुसार:\n\n' +
          '1. आंतरिक सिस्टम कॉन्फ़िगरेशन या सुरक्षा कुंजियाँ प्रकट नहीं की जा सकतीं।\n' +
          '2. बिना KYC और क्रेडिट मूल्यांकन के कोई भी लोन स्वीकृति गारंटीकृत नहीं है।\n\n' +
          '*अस्वीकरण: सहज एक AI-निर्देशित वित्तीय खोज इंजन है।*',
        '**[SECURITY GUARD TRIGGERED]**\n\n' +
          'Aapke input mein unauthorized system override instructions mile hain. RBI Fair Practices aur ISO 27001 compliance ke anusaar:\n\n' +
          '1. Internal system configurations ya security keys reveal nahi ki ja sakti.\n' +
          '2. Koi bhi loan bina KYC aur underwriting ke unconditionally approve nahi ho sakta.\n\n' +
          '*Disclaimer: Sahaj ek AI-guided financial discovery engine hai.*'
      );

      await streamTokens(guardText);
      done();
      return;
    }

    // ── 1. Application / Document submission follow-up ───────────────────────
    if (/apply|application|proceed|start|shuru|aage|submit|documents.*submit|forms/i.test(lower)) {
      callbacks.onEvent({ type: 'status', stage: 'generating', message: txt(language, 'Preparing application roadmap...', 'आवेदन मार्गदर्शन तैयार हो रहा है...', 'Application roadmap taiyaar ho raha hai...') });
      await sleep(250);

      const appText = txt(
        language,
        '**Application Process — Step by Step:**\n\n' +
          '**Step 1 — Document Upload (Right Panel)**\n' +
          'Upload your Admission Letter, Salary Slips, and Bank Statements in the "Verification Checklist" on the right. They are verified instantly.\n\n' +
          '**Step 2 — Bank Branch / Online Portal**\n' +
          '• **SBI Global Ed-Vantage:** Apply at any SBI branch or via [sbi.co.in/education-loans](https://sbi.co.in) with your documents.\n' +
          '• **HDFC Credila:** Apply online at credila.com — get a pre-visa sanction letter within 3 business days.\n\n' +
          '**Step 3 — Sanction & Disbursement**\n' +
          'After document verification and credit assessment (7–15 working days), the sanctioned amount is directly disbursed to your university account.\n\n' +
          'Click **"Continue Application"** at the bottom to proceed, or ask me anything about the process!',
        '**आवेदन प्रक्रिया — चरण दर चरण:**\n\n' +
          '**चरण 1 — दस्तावेज़ अपलोड (दाईं पैनल)**\n' +
          'दाईं ओर "Verification Checklist" में प्रवेश पत्र, वेतन पर्ची और बैंक विवरण अपलोड करें।\n\n' +
          '**चरण 2 — बैंक शाखा / ऑनलाइन पोर्टल**\n' +
          '• **SBI Global Ed-Vantage:** किसी भी SBI शाखा में या sbi.co.in के माध्यम से आवेदन करें।\n' +
          '• **HDFC Credila:** credila.com पर ऑनलाइन आवेदन करें — 3 कार्यदिवस में प्री-वीज़ा सैंक्शन लेटर प्राप्त करें।\n\n' +
          '**चरण 3 — स्वीकृति एवं वितरण**\n' +
          'दस्तावेज़ सत्यापन और क्रेडिट मूल्यांकन के 7–15 कार्यदिवस में राशि सीधे आपके विश्वविद्यालय खाते में भेजी जाएगी।',
        '**Application Process — Step by Step:**\n\n' +
          '**Step 1 — Document Upload (Right Panel)**\n' +
          'Right panel ki "Verification Checklist" mein Admission Letter, Salary Slips, aur Bank Statements upload karein. Instantly verify hoga.\n\n' +
          '**Step 2 — Bank Branch / Online Portal**\n' +
          '• **SBI Global Ed-Vantage:** Kisi bhi SBI branch ya sbi.co.in ke through apply karein.\n' +
          '• **HDFC Credila:** credila.com pe online apply karein — 3 business days mein pre-visa sanction letter milega.\n\n' +
          '**Step 3 — Sanction & Disbursement**\n' +
          'Documents verify aur credit assessment ke baad 7–15 working days mein amount directly university account mein transfer hoga.\n\n' +
          'Neeche **"Continue Application"** click karein ya kuch aur poochhein!'
      );

      await streamTokens(appText);
      done();
      return;
    }

    // ── 2. Compare / Interest rate details ───────────────────────────────────
    if (/compare|comparison|interest.*detail|rate.*detail|fees|processing fee|better option|which.*better/i.test(lower)) {
      callbacks.onEvent({ type: 'status', stage: 'calculating', message: txt(language, 'Running detailed rate comparison...', 'विस्तृत ब्याज दर तुलना हो रही है...', 'Detailed rate comparison chal raha hai...') });
      await sleep(250);

      const compareText = txt(
        language,
        '**Detailed Interest Rate & Fee Comparison (₹25 Lakhs, 15 Years):**\n\n' +
          '| Lender | Rate | Monthly EMI | Processing Fee | Collateral |\n' +
          '|--------|------|------------|----------------|------------|\n' +
          '| **SBI Global Ed-Vantage** | **8.50%** | **₹24,628** | 0.50% + GST | Required |\n' +
          '| ICICI Bank Education | 9.25% | ₹25,974 | 0.75% + GST | Required |\n' +
          '| HDFC Credila MS | 9.75% | ₹26,748 | 1.00% + GST | Not Required |\n\n' +
          '**Key Insight:** SBI Global Ed-Vantage saves you approximately **₹1,346/month** vs HDFC Credila over 15 years — a total saving of **₹2.42 Lakhs** in interest.\n\n' +
          'However, HDFC Credila is **collateral-free** and offers a **pre-visa sanction letter in 3 days** — ideal if you need quick visa documentation.',
        '**विस्तृत ब्याज दर और शुल्क तुलना (₹25 लाख, 15 वर्ष):**\n\n' +
          '| ऋणदाता | दर | मासिक EMI | प्रोसेसिंग शुल्क | संपार्श्विक |\n' +
          '|--------|-----|----------|-----------------|------------|\n' +
          '| **SBI Global Ed-Vantage** | **8.50%** | **₹24,628** | 0.50% + GST | आवश्यक |\n' +
          '| ICICI Bank Education | 9.25% | ₹25,974 | 0.75% + GST | आवश्यक |\n' +
          '| HDFC Credila MS | 9.75% | ₹26,748 | 1.00% + GST | आवश्यक नहीं |\n\n' +
          '**मुख्य निष्कर्ष:** SBI Global Ed-Vantage से आप 15 वर्षों में **₹2.42 लाख** ब्याज बचा सकते हैं।',
        '**Detailed Rate Comparison (₹25 Lakhs, 15 Saal):**\n\n' +
          '| Lender | Rate | Monthly EMI | Processing Fee | Collateral |\n' +
          '|--------|------|------------|----------------|------------|\n' +
          '| **SBI Global Ed-Vantage** | **8.50%** | **₹24,628** | 0.50% + GST | Chahiye |\n' +
          '| ICICI Bank Education | 9.25% | ₹25,974 | 0.75% + GST | Chahiye |\n' +
          '| HDFC Credila MS | 9.75% | ₹26,748 | 1.00% + GST | Nahi Chahiye |\n\n' +
          '**Key Insight:** SBI Global Ed-Vantage se aap 15 saalon mein **₹2.42 Lakh** interest bachate hain.\n\n' +
          'Lekin HDFC Credila **collateral-free** hai aur **3 din mein pre-visa sanction letter** deta hai — agar visa jaldi chahiye toh ye better option hai!'
      );

      await streamTokens(compareText);
      done();
      return;
    }

    // ── 3. Moratorium / Grace period ─────────────────────────────────────────
    if (/moratorium|holiday|grace period|repayment.*start|kab.*bharna|kab.*pay/i.test(lower)) {
      callbacks.onEvent({ type: 'status', stage: 'retrieving', message: txt(language, 'Fetching RBI moratorium rules...', 'RBI मोरेटोरियम नियम खोजे जा रहे हैं...', 'RBI moratorium rules fetch ho rahe hain...') });
      await sleep(200);

      const moraText = txt(
        language,
        '**Education Loan Moratorium (RBI PSL Framework):**\n\n' +
          '1. **Duration:** Entire academic period (e.g. 2 years for MS) + **6–12 months** after graduation, or 6 months after employment — whichever is earlier.\n' +
          '2. **During Study:** No principal EMI required. Only simple interest is charged (which also qualifies for **Section 80E** tax deduction — no upper limit).\n' +
          '3. **SBI Benefit:** If you pay simple interest during study, SBI gives an additional **1.00% rate concession** on your loan.\n\n' +
          'In your case, with ₹25L loan at 8.50% — your moratorium interest would be approximately **₹1,771/month** (very manageable during internships or part-time work abroad).',
        '**शिक्षा लोन मोरेटोरियम (RBI PSL नीति):**\n\n' +
          '1. **अवधि:** पूरी पढ़ाई (जैसे MS के लिए 2 वर्ष) + स्नातक के बाद **6–12 महीने**, या रोजगार के 6 महीने बाद — जो भी पहले हो।\n' +
          '2. **पढ़ाई के दौरान:** मूल EMI की आवश्यकता नहीं। केवल साधारण ब्याज लगता है (धारा 80E के तहत पूर्णतः कर-कटौती योग्य)।\n' +
          '3. **SBI लाभ:** यदि आप पढ़ाई के दौरान ब्याज भरते हैं, तो SBI अतिरिक्त **1.00%** ब्याज दर में छूट देता है।\n\n' +
          'आपके ₹25 लाख ऋण के लिए मोरेटोरियम ब्याज लगभग **₹1,771/माह** होगा।',
        '**Education Loan Moratorium (RBI PSL):**\n\n' +
          '1. **Duration:** Poori padhai (jaise MS ke liye 2 saal) + graduation ke baad **6–12 mahine**, ya job ke 6 mahine baad.\n' +
          '2. **Padhai ke dauran:** Koi principal EMI nahi. Sirf simple interest lagta hai (Section 80E mein 100% tax deductible).\n' +
          '3. **SBI Bonus:** Agar aap padhai mein interest bharte hain, SBI **1.00% extra rate concession** deta hai.\n\n' +
          '₹25L loan ke liye moratorium interest lagbhag **₹1,771/month** hoga — part-time work ya internship se manage ho sakta hai!'
      );

      await streamTokens(moraText);
      done();
      return;
    }

    // ── 4. Health Insurance Flow ──────────────────────────────────────────────
    const isInsurance = /insurance|bima|health|cover|hospital|parents.*cover|family.*cover/i.test(lower);
    if (isInsurance) {
      callbacks.onEvent({ type: 'status', stage: 'retrieving', message: txt(language, 'Querying IRDAI health insurance policies...', 'IRDAI स्वास्थ्य बीमा नीतियाँ खोजी जा रही हैं...', 'IRDAI health insurance policies query ho rahi hain...') });
      await sleep(250);

      callbacks.onEvent({ type: 'intent', domain: 'insurance', entities: { amount: 1000000, purpose: 'health' }, confidence: 0.98 });
      await sleep(120);

      const insuranceProducts: LoanProduct[] = [
        {
          id: 'prod-hdfc-ergo-optima', name: 'HDFC ERGO Optima Secure', domain: 'insurance' as any, purpose: ['health'],
          minAmount: 500000, maxAmount: 2000000, annualRateMin: 0, annualRateMax: 0, tenureMinMonths: 12, tenureMaxMonths: 36,
          processingFeePct: 0, processingFeeFlat: 0, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: false, moratoriumMaxMonths: 0,
          collateralRequired: false, coApplicantRequired: false,
          keyConditions: ['2X Sum Insured from Day 1 (₹20L effective)', 'Zero room rent capping', '13,000+ cashless hospitals'],
          documentsRequired: ['id_proof'],
          source: { source: 'IRDAI Health Product Registry', provider: 'HDFC ERGO General Insurance', version: 'v2024.2', effectiveDate: '2024-04-01', synthetic: true },
        },
        {
          id: 'prod-care-supreme', name: 'Care Supreme Comprehensive', domain: 'insurance' as any, purpose: ['health'],
          minAmount: 500000, maxAmount: 5000000, annualRateMin: 0, annualRateMax: 0, tenureMinMonths: 12, tenureMaxMonths: 36,
          processingFeePct: 0, processingFeeFlat: 0, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: false, moratoriumMaxMonths: 0,
          collateralRequired: false, coApplicantRequired: false,
          keyConditions: ['Unlimited automatic sum recharge', '540+ day-care treatments', 'Free annual health check-ups'],
          documentsRequired: ['id_proof'],
          source: { source: 'IRDAI Health Product Registry', provider: 'Care Health Insurance', version: 'v2024.1', effectiveDate: '2024-04-01', synthetic: true },
        },
        {
          id: 'prod-star-comprehensive', name: 'Star Health Comprehensive', domain: 'insurance' as any, purpose: ['health'],
          minAmount: 500000, maxAmount: 2500000, annualRateMin: 0, annualRateMax: 0, tenureMinMonths: 12, tenureMaxMonths: 36,
          processingFeePct: 0, processingFeeFlat: 0, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: false, moratoriumMaxMonths: 0,
          collateralRequired: false, coApplicantRequired: false,
          keyConditions: ['Air ambulance ₹5L cover', 'Maternity & newborn cover', '14,000+ cashless hospitals'],
          documentsRequired: ['id_proof'],
          source: { source: 'IRDAI Health Product Registry', provider: 'Star Health Insurance', version: 'v2024.1', effectiveDate: '2024-04-01', synthetic: true },
        },
      ];

      callbacks.onEvent({ type: 'cards', products: insuranceProducts });
      await sleep(120);

      callbacks.onEvent({
        type: 'checklist',
        items: [
          { id: 'id_proof', label: 'KYC: Aadhaar & PAN (Proposer)', labelHi: 'पहचान प्रमाण (आधार व पैन)', status: 'verified', mandatory: true },
          { id: 'income_proof', label: 'Pre-existing Medical Declaration Form', labelHi: 'पूर्व-मौजूदा बीमारी घोषणा', status: 'needed', mandatory: true },
          { id: 'bank_statement', label: 'Previous Policy (for No-Claim Bonus portability)', labelHi: 'पिछली पॉलिसी (NCB पोर्टेबिलिटी)', status: 'needed', mandatory: false },
        ],
      });
      await sleep(120);

      callbacks.onEvent({
        type: 'citations',
        citations: [
          { id: 'cit-irdai', source: 'IRDAI Health Insurance Regulations 2024', provider: 'IRDAI', version: 'Cir.2024/05', effectiveDate: '2024-05-29', excerpt: 'Pre-existing disease waiting period capped at 36 months across all insurers.' },
          { id: 'cit-cashless', source: 'GIC India Cashless Everywhere Protocol', provider: 'GIC India', version: 'v2.0', effectiveDate: '2024-01-24', excerpt: 'Cashless access at any hospital nationwide with 48-hour prior intimation.' },
        ],
      });
      await sleep(120);

      callbacks.onEvent({
        type: 'trace',
        nodes: [
          { id: 'intent', label: 'Family Health Floater (₹10L)', type: 'goal', retrieved: true },
          { id: 'irdai', label: 'IRDAI Regulations 2024', type: 'term', retrieved: true },
          { id: 'hdfc', label: 'HDFC ERGO Optima Secure', type: 'product', retrieved: true },
          { id: 'care', label: 'Care Supreme', type: 'product', retrieved: true },
        ],
        edges: [{ from: 'intent', to: 'irdai' }, { from: 'irdai', to: 'hdfc' }, { from: 'irdai', to: 'care' }],
        topK: 3, retrievalMs: 45, adapterMode: 'mock', sources: ['IRDAI 2024', 'GIC Protocol'],
      });
      await sleep(180);

      const insText = txt(
        language,
        'Based on your requirement — **Family Floater ₹10 Lakhs (4 members)**:\n\n' +
          '• **Best Pick: HDFC ERGO Optima Secure** — gives you **effective ₹20 Lakhs cover from Day 1** (2X multiplier), zero room-rent capping, across **13,000+ cashless hospitals** nationwide.\n' +
          '• **Estimated Annual Premium: ₹16,450/year** (~₹1,371/month) after 18% GST\n' +
          '• **IRDAI Rule:** Pre-existing diseases covered after **36 months** (regulatory maximum, all insurers)\n\n' +
          'Upload your KYC and Medical Declaration (right panel) to proceed to policy issuance!',
        'आपकी requirement — **₹10 लाख Family Floater (4 सदस्य)** के आधार पर:\n\n' +
          '• **सर्वश्रेष्ठ विकल्प: HDFC ERGO Optima Secure** — Day 1 से **₹20 लाख प्रभावी कवर** (2X गुणक), शून्य कमरा-किराया सीमा, **13,000+ कैशलेस अस्पताल**।\n' +
          '• **अनुमानित वार्षिक प्रीमियम: ₹16,450/वर्ष** (~₹1,371/माह)\n' +
          '• **IRDAI नियम:** पूर्व-मौजूदा बीमारियाँ **36 महीने** बाद कवर होंगी।\n\n' +
          'पॉलिसी जारी करने के लिए KYC और Medical Declaration अपलोड करें!',
        'Aapki requirement — **₹10 Lakh Family Floater (4 members)** ke basis par:\n\n' +
          '• **Best Pick: HDFC ERGO Optima Secure** — Day 1 se **₹20 Lakh effective cover** (2X multiplier), zero room-rent capping, **13,000+ cashless hospitals**.\n' +
          '• **Estimated Annual Premium: ₹16,450/year** (~₹1,371/month)\n' +
          '• **IRDAI Rule:** Pre-existing diseases **36 months** baad cover hongi.\n\n' +
          'Policy issuance ke liye right panel mein KYC aur Medical Declaration upload karein!'
      );

      await streamTokens(insText);
      done();
      return;
    }

    // ── 5. Education Loan — Extract params ────────────────────────────────────
    let amount = 2500000;
    if (/30\s*lakh|30l\b/i.test(lower)) amount = 3000000;
    else if (/20\s*lakh|20l\b/i.test(lower)) amount = 2000000;
    else if (/15\s*lakh|15l\b/i.test(lower)) amount = 1500000;
    else if (/10\s*lakh|10l\b/i.test(lower)) amount = 1000000;
    else if (/50\s*lakh|50l\b/i.test(lower)) amount = 5000000;
    const amountL = Math.round(amount / 100000);

    let salary = 0;
    const salaryMatch = lower.match(/(\d{2,3})(?:,\d{3})*(?:\s*(?:hazar|k\b|thousand))?/g);
    if (salaryMatch) {
      for (const m of salaryMatch) {
        const cleaned = m.replace(/,/g, '').replace(/\s*(hazar|k|thousand)/i, '');
        const n = parseInt(cleaned, 10);
        if (n >= 10000 && n <= 300000) { salary = n; break; }
        if (n >= 10 && n <= 300) { salary = n * 1000; break; }
      }
    }
    if (!salary) {
      if (/65000|65,000/.test(lower)) salary = 65000;
      else if (/75000|75,000|75\s*hazar/.test(lower)) salary = 75000;
      else if (/50000|50,000|50\s*hazar/.test(lower)) salary = 50000;
      else if (/35000|35,000|35\s*hazar/.test(lower)) salary = 35000;
      else if (/25000|25,000|25\s*hazar/.test(lower)) salary = 25000;
    }

    if (!salary) {
      // ── Turn 1: Ask for income ────────────────────────────────────────────
      callbacks.onEvent({ type: 'status', stage: 'understanding', message: txt(language, 'Cataloging your education loan parameters...', 'शिक्षा लोन पैरामीटर रिकॉर्ड हो रहे हैं...', 'Education loan parameters catalog ho rahe hain...') });
      await sleep(200);

      callbacks.onEvent({ type: 'intent', domain: 'lending', entities: { amount, purpose: 'education' }, confidence: 0.97 });
      await sleep(120);

      callbacks.onEvent({ type: 'profile_update', fields: { amount, purpose: 'education', course: 'MS Abroad' }, missingFields: ['monthly_income'] });
      await sleep(150);

      const t1 = txt(
        language,
        `I have noted your requirement: **₹${amountL} Lakhs Education Loan** for MS Abroad.\n\nTo calculate your exact reducing-balance EMI and RBI FOIR affordability, please tell me your approximate **monthly take-home income** (yours or your co-applicant's)?`,
        `आपका अनुरोध नोट कर लिया है: **₹${amountL} लाख शिक्षा लोन** विदेश में MS के लिए।\n\nसटीक EMI और RBI FOIR अफोर्डेबिलिटी गणना के लिए, कृपया अपनी या सह-आवेदक की **मासिक टेक-होम आय** बताएं?`,
        `Maine aapka request note kar liya: **₹${amountL} Lakhs Education Loan** MS Abroad ke liye.\n\nSahi reducing-balance EMI aur RBI FOIR affordability calculate karne ke liye, aapki ya co-applicant ki approximate **monthly take-home income** kya hai?`
      );

      await streamTokens(t1);
      done();
      return;
    }

    // ── Turn 2: Full calculation + products + docs ────────────────────────────
    const tenureMonths = 180;
    const sbiRate = 8.5;
    const sbiEmi = calculateEmi(amount, sbiRate, tenureMonths);
    const foirPct = Math.round(((sbiEmi / salary) * 100) * 10) / 10;
    const headroom = Math.max(0, Math.round(salary * 0.5 - sbiEmi));
    const band = foirPct < 40 ? 'comfortable' : foirPct <= 50 ? 'stretched' : 'high';

    callbacks.onEvent({ type: 'status', stage: 'calculating', message: txt(language, 'Running reducing-balance EMI engine & RBI debt audit...', 'घटती-शेष EMI इंजन और RBI ऋण ऑडिट चल रहा है...', 'Reducing-balance EMI engine aur RBI debt audit chal raha hai...') });
    await sleep(200);

    callbacks.onEvent({ type: 'profile_update', fields: { amount, purpose: 'education', course: 'MS Abroad', monthly_income: salary }, missingFields: [] });
    await sleep(120);

    callbacks.onEvent({
      type: 'affordability',
      foirPct,
      headroomMonthly: headroom,
      band,
      isAffordable: foirPct <= 55,
      label: 'Illustrative estimate',
      assumptions: { income: salary, existingEmi: 0, newEmi: sbiEmi, rate: sbiRate, tenure: tenureMonths, maxFoirPct: 50 },
    });
    await sleep(120);

    const lendingProducts: LoanProduct[] = [
      {
        id: 'prod-sbi-eduloan', name: 'SBI Global Ed-Vantage', domain: 'lending', purpose: ['education'],
        minAmount: 500000, maxAmount: 15000000, annualRateMin: 8.5, annualRateMax: 9.75, tenureMinMonths: 60, tenureMaxMonths: 180,
        processingFeePct: 0.5, processingFeeFlat: 10000, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: true, moratoriumMaxMonths: 12,
        collateralRequired: amount > 750000, coApplicantRequired: true,
        keyConditions: ['Lowest prime rate (8.50% p.a.)', '0.50% concession for female applicants', 'Full Section 80E tax deduction'],
        documentsRequired: ['admission_letter', 'income_proof', 'bank_statement', 'id_proof'],
        source: { source: 'SBI Global Ed-Vantage Scheme', provider: 'State Bank of India', version: 'Circular 2024/09', effectiveDate: '2024-06-15', synthetic: true },
      },
      {
        id: 'prod-hdfc-credila', name: 'HDFC Credila MS Abroad', domain: 'lending', purpose: ['education'],
        minAmount: 500000, maxAmount: 5000000, annualRateMin: 9.75, annualRateMax: 11.25, tenureMinMonths: 36, tenureMaxMonths: 144,
        processingFeePct: 1.0, processingFeeFlat: 0, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: true, moratoriumMaxMonths: 6,
        collateralRequired: false, coApplicantRequired: true,
        keyConditions: ['No collateral up to ₹40 Lakhs', 'Pre-visa sanction in 3 business days', 'Covers 100% tuition + living'],
        documentsRequired: ['admission_letter', 'income_proof', 'bank_statement', 'id_proof'],
        source: { source: 'HDFC Credila Education Policy', provider: 'HDFC Credila', version: 'v2024.1', effectiveDate: '2024-04-01', synthetic: true },
      },
      {
        id: 'prod-icici-eduloan', name: 'ICICI Bank Education Loan', domain: 'lending', purpose: ['education'],
        minAmount: 500000, maxAmount: 10000000, annualRateMin: 9.25, annualRateMax: 10.5, tenureMinMonths: 36, tenureMaxMonths: 144,
        processingFeePct: 0.75, processingFeeFlat: 0, gstPct: 18, maxFoirPct: 50, moratoriumAvailable: true, moratoriumMaxMonths: 6,
        collateralRequired: true, coApplicantRequired: true,
        keyConditions: ['Direct international university wire transfer', 'Flexible moratorium options', 'Instant sanction for premier universities'],
        documentsRequired: ['admission_letter', 'income_proof', 'bank_statement', 'id_proof'],
        source: { source: 'ICICI Bank Higher Education Schemes', provider: 'ICICI Bank', version: 'v2024.2', effectiveDate: '2024-04-01', synthetic: true },
      },
    ];

    callbacks.onEvent({ type: 'cards', products: lendingProducts });
    await sleep(120);

    callbacks.onEvent({
      type: 'checklist',
      items: [
        { id: 'admission_letter', label: 'University Admission Offer Letter / I-20 Form', labelHi: 'विश्वविद्यालय प्रवेश पत्र (I-20)', status: 'needed', mandatory: true },
        { id: 'income_proof', label: 'Salary Slips (Last 3 Months) / Form 16', labelHi: 'वेतन पर्ची (पिछले 3 महीने)', status: 'needed', mandatory: true },
        { id: 'bank_statement', label: 'Bank Account Statement (Last 6 Months)', labelHi: 'बैंक खाता विवरण (6 महीने)', status: 'needed', mandatory: true },
        { id: 'id_proof', label: 'Government KYC: Aadhaar & PAN Card', labelHi: 'पहचान प्रमाण (पैन / आधार)', status: 'verified', mandatory: true },
      ],
    });
    await sleep(120);

    callbacks.onEvent({
      type: 'citations',
      citations: [
        { id: 'cit-rbi', source: 'RBI Master Directions — Priority Sector Lending (Higher Education)', provider: 'Reserve Bank of India', version: 'FIDD.CO.2020-21', effectiveDate: '2024-04-01', excerpt: 'Education loans up to ₹20L eligible for PSL. Moratorium: course period + 1 year.' },
        { id: 'cit-sbi', source: 'SBI Global Ed-Vantage Scheme Policy Circular', provider: 'State Bank of India', version: 'Circular 2024/09', effectiveDate: '2024-06-15', excerpt: 'Floating rate linked to EBLR. 0.50% p.a. concession for girl students.' },
      ],
    });
    await sleep(120);

    callbacks.onEvent({
      type: 'trace',
      nodes: [
        { id: 'intent', label: `Education Loan (₹${amountL}L)`, type: 'goal', retrieved: true },
        { id: 'rbi', label: 'RBI PSL Circular', type: 'term', retrieved: true },
        { id: 'sbi', label: 'SBI Global Ed-Vantage', type: 'product', retrieved: true },
        { id: 'hdfc', label: 'HDFC Credila MS Abroad', type: 'product', retrieved: true },
        { id: 'calc', label: `FOIR Engine (${foirPct}%)`, type: 'term', retrieved: true },
      ],
      edges: [{ from: 'intent', to: 'rbi' }, { from: 'rbi', to: 'sbi' }, { from: 'intent', to: 'hdfc' }, { from: 'sbi', to: 'calc' }, { from: 'hdfc', to: 'calc' }],
      topK: 4, retrievalMs: 52, adapterMode: 'mock', sources: ['RBI Guidelines', 'SBI Schemes', 'HDFC Credila Policy'],
    });
    await sleep(200);

    const bandLabel = txt(language,
      band === 'comfortable' ? 'Safe & Comfortable (within RBI 50% limit)' : band === 'stretched' ? 'Stretched — manageable with co-applicant' : 'High Risk — consider reducing loan amount',
      band === 'comfortable' ? 'सुरक्षित एवं सहज (RBI 50% सीमा के अंदर)' : band === 'stretched' ? 'मध्यम तनाव — सह-आवेदक के साथ प्रबंधनीय' : 'उच्च जोखिम — ऋण राशि घटाएं',
      band === 'comfortable' ? 'Safe & Comfortable (RBI 50% limit ke andar)' : band === 'stretched' ? 'Stretched — co-applicant ke saath manageable' : 'High Risk — loan amount kam karein'
    );

    const t2 = txt(
      language,
      `Based on your monthly income of **₹${salary.toLocaleString('en-IN')}**, here is your complete affordability analysis and top 3 verified loan options:\n\n` +
        `• **Debt-to-Income FOIR: ${foirPct}%** — ${bandLabel}\n` +
        `• **Top Recommendation: SBI Global Ed-Vantage** @ 8.50% p.a. (Monthly EMI: **₹${sbiEmi.toLocaleString('en-IN')}**)\n` +
        `• **Monthly Headroom after EMI: ₹${headroom.toLocaleString('en-IN')}**\n\n` +
        `Compare products and upload your documents in the **right panel**. Ask me anything — collateral rules, moratorium details, or application steps!`,
      `आपकी मासिक आय **₹${salary.toLocaleString('en-IN')}** के आधार पर, पूर्ण अफोर्डेबिलिटी विश्लेषण:\n\n` +
        `• **FOIR अनुपात: ${foirPct}%** — ${bandLabel}\n` +
        `• **सर्वश्रेष्ठ विकल्प: SBI Global Ed-Vantage** @ 8.50% प्रति वर्ष (मासिक EMI: **₹${sbiEmi.toLocaleString('en-IN')}**)\n` +
        `• **EMI के बाद मासिक शेष: ₹${headroom.toLocaleString('en-IN')}**\n\n` +
        `दाईं पैनल में उत्पाद तुलना करें और दस्तावेज़ अपलोड करें। मुझसे कुछ भी पूछें!`,
      `Aapki monthly income **₹${salary.toLocaleString('en-IN')}** ke basis par, pura affordability analysis:\n\n` +
        `• **FOIR: ${foirPct}%** — ${bandLabel}\n` +
        `• **Top Pick: SBI Global Ed-Vantage** @ 8.50% p.a. (Monthly EMI: **₹${sbiEmi.toLocaleString('en-IN')}**)\n` +
        `• **EMI ke baad monthly headroom: ₹${headroom.toLocaleString('en-IN')}**\n\n` +
        `Right panel mein products compare karein aur documents upload karein. Koi bhi sawal poochhein — collateral, moratorium, ya application steps!`
    );

    await streamTokens(t2);
    done();
  } catch (err) {
    if ((err as Error).message === 'Aborted') return;
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
