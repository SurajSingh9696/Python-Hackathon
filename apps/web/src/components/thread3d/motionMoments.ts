/**
 * Choreographed Motion Moments for Sahaj 3D Journey Thread.
 *
 * Defines the timing and spring targets for the 4 key narrative milestones:
 * 1. FIRST_QUERY: Thread wakes up with a travelling light pulse (uHead 0.0 -> 0.3)
 * 2. PROFILE_COMPLETE: Tangled loop morphs into structured curve (uResolve 0.1 -> 0.6)
 * 3. PRODUCT_SELECTED: Selected option triggers focused milestone glow
 * 4. SANCTION_READY: Entire thread aligns with shimmering cyan glow (uResolve -> 1.0)
 */

export interface MotionMoment {
  id: string;
  name: string;
  targetResolve: number;
  pulseDurationMs: number;
  soundCue?: string;
}

export const MOTION_MOMENTS: Record<string, MotionMoment> = {
  FIRST_QUERY: {
    id: 'first_query',
    name: 'Journey Awakening',
    targetResolve: 0.25,
    pulseDurationMs: 600,
  },
  PROFILE_COMPLETE: {
    id: 'profile_complete',
    name: 'Thread Untangling',
    targetResolve: 0.65,
    pulseDurationMs: 900,
  },
  PRODUCT_SELECTED: {
    id: 'product_selected',
    name: 'Option Locked',
    targetResolve: 0.85,
    pulseDurationMs: 500,
  },
  SANCTION_READY: {
    id: 'sanction_ready',
    name: 'Journey Resolved',
    targetResolve: 1.0,
    pulseDurationMs: 1200,
  },
};
