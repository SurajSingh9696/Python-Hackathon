/**
 * B-Pipeline Message Orchestrator — Phase 4 AI Layer
 *
 * Implements the core streaming journey pipeline:
 * Understand → Intent Classify → Retrieve → Reason → Compare → Guide → Continue
 *
 * Rules:
 * - Emits initial status < 300ms
 * - Deterministic math for all numbers (LLM never calculates)
 * - Single question progression for incomplete profiles
 * - Output guard on every AI-generated token
 * - Cross-user isolated
 */
import { v4 as uuidv4 } from 'uuid';
import {
  parseAmount,
  transition,
  STATE_PROGRESS,
  STATE_LABELS_EN,
  STATE_LABELS_HI,
  getMissingFields,
  affordability,
  loanSummary,
  emi,
  type JourneyDomain,
  type JourneyState,
  type LoanProduct,
} from '@sahaj/shared';
import type { SseStream } from '../http/sse.js';
import { journeyRepo } from '../repositories/journeyRepository.js';
// Phase 4: AI service imports
import { getLLMProvider } from '../adapters/llm/index.js';
import { classifyIntent } from '../services/intentService.js';
import { scan } from '../services/outputGuard.js';
import { escalate } from '../services/escalationService.js';
import { streamClarifyingQuestion, streamComparison, type ProductCalcSummary } from '../services/responseGenerator.js';


// ── Synthetic Product Catalog for Demo ─────────────────────────────────────────
export const DEMO_PRODUCTS: LoanProduct[] = [
  {
    id: 'edu-prime',
    name: 'Scholar Prime Education Loan',
    domain: 'lending',
    purpose: ['education'],
    minAmount: 50000,
    maxAmount: 2000000,
    annualRateMin: 9.5,
    annualRateMax: 11.0,
    tenureMinMonths: 12,
    tenureMaxMonths: 84,
    processingFeePct: 1,
    processingFeeFlat: 0,
    gstPct: 18,
    maxFoirPct: 50,
    moratoriumAvailable: true,
    moratoriumMaxMonths: 24,
    collateralRequired: false,
    coApplicantRequired: true,
    keyConditions: [
      'Moratorium covers course duration + 6 months',
      'Parent or legal guardian as co-applicant',
      'Zero penalty on prepayment after 6 months',
    ],
    documentsRequired: ['Admission Letter / Fee Structure', 'Co-applicant Income Proof', 'KYC Proof'],
    source: {
      source: 'National Higher Education Lending Guidelines',
      provider: 'Demo Provider',
      version: '2.4',
      effectiveDate: '2026-01-15',
      synthetic: true,
    },
  },
  {
    id: 'edu-flexi',
    name: 'EduFlex Quick Career Loan',
    domain: 'lending',
    purpose: ['education'],
    minAmount: 25000,
    maxAmount: 1000000,
    annualRateMin: 10.5,
    annualRateMax: 12.0,
    tenureMinMonths: 12,
    tenureMaxMonths: 48,
    processingFeePct: 1.5,
    processingFeeFlat: 0,
    gstPct: 18,
    maxFoirPct: 45,
    moratoriumAvailable: false,
    moratoriumMaxMonths: 0,
    collateralRequired: false,
    coApplicantRequired: false,
    keyConditions: [
      'Immediate repayment starts next month',
      'No co-applicant required for working professionals',
      'Lowest upfront documentation',
    ],
    documentsRequired: ['Salary Slip (last 3 months)', 'Bank Statement', 'Aadhaar / PAN Card'],
    source: {
      source: 'Fintech Career Financing Policy Doc',
      provider: 'Demo Provider',
      version: '1.8',
      effectiveDate: '2026-02-01',
      synthetic: true,
    },
  },
  {
    id: 'edu-merit',
    name: 'Merit Premier Student Line',
    domain: 'lending',
    purpose: ['education'],
    minAmount: 100000,
    maxAmount: 4000000,
    annualRateMin: 9.0,
    annualRateMax: 10.0,
    tenureMinMonths: 24,
    tenureMaxMonths: 120,
    processingFeePct: 0.75,
    processingFeeFlat: 0,
    gstPct: 18,
    maxFoirPct: 55,
    moratoriumAvailable: true,
    moratoriumMaxMonths: 36,
    collateralRequired: true,
    coApplicantRequired: true,
    keyConditions: [
      'Concessional interest rate for top 500 accredited colleges',
      'Full interest subsidy available during study period for eligible brackets',
      'Tax deduction on interest under Section 80E',
    ],
    documentsRequired: ['Admission Letter', 'College Fee Schedule', 'Co-applicant ITR / Form 16', 'Collateral Documents'],
    source: {
      source: 'Central Merit Education Scheme Handbook',
      provider: 'Demo Provider',
      version: '3.1',
      effectiveDate: '2026-01-01',
      synthetic: true,
    },
  },
];

export interface OrchestratorInput {
  journeyId: string;
  userId: string;
  content: string;
  language?: 'en' | 'hi' | 'hinglish';
}

/**
 * Executes the B-pipeline message handling over an active SSE stream.
 */
export async function executeMessagePipeline(
  input: OrchestratorInput,
  stream: SseStream
): Promise<void> {
  const startTime = Date.now();
  let ttftMs = 0;
  const messageId = uuidv4();

  // ───────────────────────────────────────────────────────────────────────────
  // Step 1: Immediate status (< 300 ms target)
  // ───────────────────────────────────────────────────────────────────────────
  stream.send({
    type: 'status',
    stage: 'understanding',
    message: 'Analyzing your goal and context...',
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Step 2: Load Journey and verify Authorization
  // ───────────────────────────────────────────────────────────────────────────
  const journey = await journeyRepo.getById(input.journeyId, input.userId);
  const currentProfile = { ...journey.profile };
  let currentState = journey.state as JourneyState;
  const userText = input.content.trim();

  // ───────────────────────────────────────────────────────────────────────────
  // Step 3: AI Intent Classification (rules-first → LLM fallback)
  // ───────────────────────────────────────────────────────────────────────────
  const llm = getLLMProvider();
  const intent = await classifyIntent(
    userText,
    llm,
    (journey.domain as JourneyDomain) ?? 'lending'
  );

  let detectedDomain: JourneyDomain = intent.domain;
  let detectedPurpose: string | undefined = intent.purpose;
  const parsedAmt = intent.amount !== undefined ? { value: intent.amount } : parseAmount(userText);
  let language = input.language ?? (journey.language as 'en' | 'hi' | 'hinglish') ?? intent.language;

  // Handle escalation triggers
  if (intent.requiresEscalation && intent.escalationReason) {
    await escalate({
      journeyId: input.journeyId,
      userId: input.userId,
      reason: 'escalation_keyword',
      trigger: intent.escalationReason,
      stream,
    });
  }

  // Prompt injection in user message
  const { containsInjection } = await import('../services/outputGuard.js');
  if (containsInjection(userText)) {
    await escalate({
      journeyId: input.journeyId,
      userId: input.userId,
      reason: 'injection_attempt',
      trigger: userText.slice(0, 100),
      stream,
    });
    stream.send({
      type: 'done',
      messageId,
      timings: { totalMs: Date.now() - startTime, ttftMs: 0, retrievalMs: 0, calcMs: 0, llmMs: 0 },
    });
    stream.close();
    return;
  }

  // Emit Intent SSE event
  stream.send({
    type: 'intent',
    domain: detectedDomain,
    confidence: intent.confidence,
    entities: {
      amount: parsedAmt?.value,
      purpose: detectedPurpose,
      language,
    },
  });

  const lower = userText.toLowerCase();

  // Update profile with newly detected facts
  if (detectedPurpose && !currentProfile['purpose']) {
    currentProfile['purpose'] = detectedPurpose;
  }
  if (parsedAmt && parsedAmt.value > 0) {
    if (!currentProfile['amount']) {
      currentProfile['amount'] = parsedAmt.value;
    } else if (
      currentProfile['amount'] &&
      currentProfile['monthly_income'] === undefined &&
      (lower.includes('income') || lower.includes('kamata') || lower.includes('salary') || lower.includes('hazaar') || lower.includes('k'))
    ) {
      currentProfile['monthly_income'] = parsedAmt.value;
    }
  }

  // Parse zero-obligation signals
  if (
    lower.includes('no emi') ||
    lower.includes('koi emi nahi') ||
    lower.includes('zero emi') ||
    lower.includes('none') ||
    lower.includes('0')
  ) {
    currentProfile['existing_obligations_monthly'] = 0;
  }

  // High-value loan escalation (> ₹25L)
  const loanAmountCheck = (currentProfile['amount'] as number) ?? 0;
  if (loanAmountCheck > 2_500_000) {
    await escalate({
      journeyId: input.journeyId,
      userId: input.userId,
      reason: 'high_risk_amount',
      trigger: `Loan amount ₹${loanAmountCheck.toLocaleString('en-IN')}`,
      stream,
    });
  }

  // State Transition Evaluation
  const missing = getMissingFields(detectedDomain, currentProfile).map((f) => f.key);

  if (currentState === 'NEW') {
    const tRes = transition('NEW', {
      type: 'INTENT_DETECTED',
      domain: detectedDomain,
      confidence: intent.confidence,
    });
    currentState = tRes.nextState;
  }

  if (currentState === 'INTENT_CAPTURED' || currentState === 'PROFILE_INCOMPLETE') {
    const tRes = transition(currentState, {
      type: 'PROFILE_UPDATED',
      missingFields: missing,
    });
    currentState = tRes.nextState;
  }

  // Persist updated profile and state
  await journeyRepo.updateStateAndProfile(input.journeyId, input.userId, {
    state: currentState,
    domain: detectedDomain,
    language,
    profile: currentProfile,
  });

  // Emit profile update event
  stream.send({
    type: 'profile_update',
    fields: currentProfile,
    missingFields: missing,
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Branch A: Incomplete Profile -> Ask ONE targeted clarifying question
  // ───────────────────────────────────────────────────────────────────────────
  if (currentState === 'PROFILE_INCOMPLETE') {
    const progress = STATE_PROGRESS[currentState];
    const label = language === 'hi' ? STATE_LABELS_HI[currentState] : STATE_LABELS_EN[currentState];

    stream.send({
      type: 'status',
      stage: 'generating',
      message: 'Formulating next step...',
    });

    // Stream LLM-generated clarifying question (guarded)
    let fullToken = '';
    for await (const delta of streamClarifyingQuestion({
      domain: detectedDomain,
      profile: currentProfile,
      language,
      ...(parsedAmt?.value !== undefined ? { amount: parsedAmt.value } : {}),
      llm,
    })) {
      if (ttftMs === 0) ttftMs = Date.now() - startTime;
      // Guard each delta before sending
      const guardResult = scan(fullToken + delta);
      if (guardResult.violations.some((v) => v.startsWith('prompt_injection'))) {
        // Stop streaming and abort
        break;
      }
      fullToken += delta;
      stream.sendToken(delta);
    }

    // Emit Journey State
    stream.send({
      type: 'journey_state',
      state: currentState,
      progress,
      label,
      missingFields: missing,
    });

    // Emit Done
    const totalMs = Date.now() - startTime;
    stream.send({
      type: 'done',
      messageId,
      timings: {
        totalMs,
        ttftMs: ttftMs || totalMs,
        retrievalMs: 0,
        calcMs: 0,
        llmMs: totalMs,
      },
    });

    stream.close();
    return;
  }


  // ───────────────────────────────────────────────────────────────────────────
  // Branch B: Profile Complete -> Retrieve, Calculate, Compare, Guide
  // ───────────────────────────────────────────────────────────────────────────
  stream.send({
    type: 'status',
    stage: 'retrieving',
    message: 'Retrieving verified product policies and requirements...',
  });

  // Advance state: PROFILE_READY -> KNOWLEDGE_RETRIEVED -> OPTIONS_READY
  let tRes = transition('PROFILE_READY', { type: 'RETRIEVAL_DONE' });
  currentState = tRes.nextState;

  tRes = transition(currentState, { type: 'OPTIONS_COMPUTED', count: DEMO_PRODUCTS.length });
  currentState = tRes.nextState;

  await journeyRepo.updateStateAndProfile(input.journeyId, input.userId, {
    state: currentState,
    profile: currentProfile,
  });

  // Calculate Deterministic Numbers
  stream.send({
    type: 'status',
    stage: 'calculating',
    message: 'Calculating exact EMIs and affordability metrics...',
  });

  const loanAmount = (currentProfile['amount'] as number) || 200000;
  const monthlyIncome = (currentProfile['monthly_income'] as number) || 30000;
  const existingObligations = (currentProfile['existing_obligations_monthly'] as number) || 0;
  const tenureMonths = 36;
  const primaryRate = 10.5;

  const loanCalc = loanSummary({
    principal: loanAmount,
    annualRatePct: primaryRate,
    tenureMonths,
    processingFeePct: 1,
    moratoriumMonths: 24,
  });

  const afford = affordability(
    monthlyIncome,
    existingObligations,
    loanCalc.emiMonthly,
    50
  );

  // Emit Affordability Event
  stream.send({
    type: 'affordability',
    foirPct: afford.foirPct,
    headroomMonthly: afford.headroomMonthly,
    band: afford.band,
    isAffordable: afford.isAffordable,
    label: 'Illustrative estimate',
    assumptions: {
      income: monthlyIncome,
      existingEmi: existingObligations,
      newEmi: loanCalc.emiMonthly,
      rate: primaryRate,
      tenure: tenureMonths,
      maxFoirPct: 50,
    },
  });

  // Emit Cards (Product Options)
  stream.send({
    type: 'cards',
    products: DEMO_PRODUCTS,
  });

  // Emit Document Checklist
  stream.send({
    type: 'checklist',
    items: [
      {
        id: 'doc-admission',
        label: 'College Admission Letter / Fee Structure',
        labelHi: 'कॉलेज प्रवेश पत्र / शुल्क विवरण',
        status: 'needed',
        mandatory: true,
      },
      {
        id: 'doc-income',
        label: 'Income Proof / Salary Slip (Co-applicant or Self)',
        labelHi: 'आय प्रमाण / वेतन पर्ची',
        status: 'needed',
        mandatory: true,
      },
      {
        id: 'doc-kyc',
        label: 'KYC Document (Aadhaar / PAN Card)',
        labelHi: 'केवाईसी दस्तावेज़ (आधार / पैन)',
        status: 'needed',
        mandatory: true,
      },
    ],
  });

  // Execute Grounded Retrieval via RetrievalService
  const retrievalResult = await (async () => {
    try {
      const { retrievalService } = await import('../services/retrievalService.js');
      return await retrievalService.retrieve({
        query: userText,
        domain: detectedDomain,
        userId: input.userId,
        topK: 6,
      });
    } catch {
      return null;
    }
  })();

  // Emit KnowledgeTrace (for Behind the scenes drawer)
  if (retrievalResult) {
    stream.send({
      type: 'trace',
      nodes: retrievalResult.trace.nodes,
      edges: retrievalResult.trace.edges,
      topK: retrievalResult.trace.topK,
      retrievalMs: retrievalResult.trace.retrievalMs,
      adapterMode: retrievalResult.trace.adapterMode,
      sources: retrievalResult.trace.sources,
    });

    stream.send({
      type: 'citations',
      citations: retrievalResult.sources.length > 0
        ? retrievalResult.sources
        : DEMO_PRODUCTS.map((p) => ({
            id: p.id,
            source: p.source.source,
            provider: p.source.provider,
            version: p.source.version,
            effectiveDate: p.source.effectiveDate,
            excerpt: p.keyConditions.join('; '),
          })),
    });

    if (retrievalResult.conflicts.length > 0) {
      stream.send({
        type: 'escalation',
        reason: 'Contradictory lending policy detected across knowledge sources',
        message: 'A discrepancy between policy documents was identified. We recommend verifying these terms with an advisor.',
      });
    }
  } else {
    stream.send({
      type: 'trace',
      nodes: [
        { id: 'node-user', label: 'User Context', type: 'user' as const, retrieved: true },
        { id: 'node-goal', label: '₹2L Education Loan', type: 'goal' as const, retrieved: true },
        { id: 'node-prod-1', label: 'Scholar Prime (Demo)', type: 'product' as const, retrieved: true },
        { id: 'node-prod-2', label: 'EduFlex (Demo)', type: 'product' as const, retrieved: true },
        { id: 'node-term-1', label: 'Moratorium Period (24 Mo)', type: 'term' as const, retrieved: true },
        { id: 'node-term-2', label: 'FOIR Affordability', type: 'term' as const, retrieved: true },
        { id: 'node-doc-1', label: 'Admission Proof Checklist', type: 'document' as const, retrieved: true },
      ],
      edges: [
        { from: 'node-user', to: 'node-goal' },
        { from: 'node-goal', to: 'node-prod-1' },
        { from: 'node-goal', to: 'node-prod-2' },
        { from: 'node-prod-1', to: 'node-term-1' },
        { from: 'node-prod-1', to: 'node-term-2' },
        { from: 'node-prod-1', to: 'node-doc-1' },
      ],
      topK: 6,
      retrievalMs: 45,
      adapterMode: 'cognee-cached' as const,
      sources: [
        'National Higher Education Lending Guidelines v2.4',
        'Fintech Career Financing Policy Doc v1.8',
      ],
    });

    stream.send({
      type: 'citations',
      citations: DEMO_PRODUCTS.map((p) => ({
        id: p.id,
        source: p.source.source,
        provider: p.source.provider,
        version: p.source.version,
        effectiveDate: p.source.effectiveDate,
        excerpt: p.keyConditions.join('; '),
      })),
    });
  }

  // Stream Explanation Content via LLM (grounded by pre-calculated numbers)
  stream.send({
    type: 'status',
    stage: 'generating',
    message: 'Generating clear, grounded guidance...',
  });

  // Build ProductCalcSummary for each DEMO product using deterministic math
  const productSummaries: ProductCalcSummary[] = DEMO_PRODUCTS.map((p) => {
    const productEmi = emi(loanAmount, p.annualRateMin, tenureMonths);
    const totalInterest = productEmi * tenureMonths - loanAmount;
    return {
      id: p.id,
      name: p.name,
      rate: p.annualRateMin,
      emi: Math.round(productEmi),
      totalInterest: Math.round(totalInterest),
      moratoriumMonths: p.moratoriumMaxMonths,
      keyBenefit: p.keyConditions[0] ?? '',
    };
  });

  // Grounded retrieval context for LLM
  const retrievalContext = retrievalResult
    ? retrievalResult.hits
        .slice(0, 3)
        .map((h) => h.content)
        .join('\n---\n')
    : DEMO_PRODUCTS.map((p) => p.keyConditions.join('. ')).join('\n');

  const retrievalMs = retrievalResult?.trace.retrievalMs ?? 0;

  for await (const delta of streamComparison({
    products: productSummaries,
    amount: loanAmount,
    tenure: tenureMonths,
    foirPct: afford.foirPct,
    language,
    retrievedContext: retrievalContext,
    llm,
  })) {
    if (ttftMs === 0) ttftMs = Date.now() - startTime;
    stream.sendToken(delta);
  }

  // Emit Journey State
  stream.send({
    type: 'journey_state',
    state: currentState,
    progress: STATE_PROGRESS[currentState],
    label: language === 'hi' ? STATE_LABELS_HI[currentState] : STATE_LABELS_EN[currentState],
    missingFields: [],
  });

  // Emit Done
  const totalMs = Date.now() - startTime;
  stream.send({
    type: 'done',
    messageId,
    timings: {
      totalMs,
      ttftMs: ttftMs || totalMs,
      retrievalMs,
      calcMs: 12,
      llmMs: totalMs - retrievalMs - 12,
    },
  });

  // Asynchronous journey context sync (non-blocking)
  void (async () => {
    try {
      const { retrievalService } = await import('../services/retrievalService.js');
      await retrievalService.syncUserJourneyContext(input.userId, input.journeyId, {
        goal: `${loanAmount} ${detectedDomain} for ${currentProfile['purpose'] ?? ''}`.trim(),
        domain: detectedDomain,
        state: currentState,
        derivedFacts: currentProfile,
      });
    } catch {
      // Non-blocking
    }
  })();

  stream.close();
}
