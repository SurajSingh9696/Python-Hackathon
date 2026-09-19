import { describe, it, expect } from 'vitest';
import { detectRenderingTier } from '../components/thread3d/probe';
import { MOTION_MOMENTS } from '../components/thread3d/motionMoments';
import { createThreadUniforms } from '../components/thread3d/shaders';

describe('3D Thread & Motion Engine', () => {
  it('detectRenderingTier returns valid tier structure', () => {
    const caps = detectRenderingTier();
    expect(['full', 'lite', 'poster']).toContain(caps.tier);
    expect(typeof caps.reducedMotion).toBe('boolean');
  });

  it('createThreadUniforms initializes with required uniforms', () => {
    const uniforms = createThreadUniforms();
    expect(uniforms.uTime).toBeDefined();
    expect(uniforms.uResolve).toBeDefined();
    expect(uniforms.uHead).toBeDefined();
    expect(uniforms.uColorResolved).toBeDefined();
    expect(uniforms.uColorUnresolved).toBeDefined();

    expect(uniforms.uResolve.value).toBe(0.1);
  });

  it('contains all 4 choreographed motion moments', () => {
    expect(MOTION_MOMENTS.FIRST_QUERY.targetResolve).toBe(0.25);
    expect(MOTION_MOMENTS.PROFILE_COMPLETE.targetResolve).toBe(0.65);
    expect(MOTION_MOMENTS.PRODUCT_SELECTED.targetResolve).toBe(0.85);
    expect(MOTION_MOMENTS.SANCTION_READY.targetResolve).toBe(1.0);
  });
});
