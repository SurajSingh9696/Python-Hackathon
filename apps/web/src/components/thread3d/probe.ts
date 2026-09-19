/**
 * Hardware and WebGL capability detection for JourneyThread 3D canvas.
 * Tiers:
 * - 'full': High-performance WebGL 2, desktop / fast mobile, full geometry + shaders
 * - 'lite': WebGL 1 or lower-spec device, reduced segment count, no postprocessing
 * - 'poster': Fallback to 2D SVG animation (no WebGL, low memory, or prefers-reduced-motion)
 */

export type RenderingTier = 'full' | 'lite' | 'poster';

export interface DeviceCapabilities {
  tier: RenderingTier;
  webgl: boolean;
  webgl2: boolean;
  reducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  effectiveType?: string;
}

export function detectRenderingTier(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return { tier: 'poster', webgl: false, webgl2: false, reducedMotion: false };
  }

  // 1. Accessibility: reduced motion check
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    return { tier: 'poster', webgl: false, webgl2: false, reducedMotion: true };
  }

  // 2. WebGL support check
  let webgl = false;
  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    webgl2 = Boolean(canvas.getContext('webgl2'));
    webgl = webgl2 || Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    webgl = false;
    webgl2 = false;
  }

  if (!webgl) {
    return { tier: 'poster', webgl: false, webgl2: false, reducedMotion: false };
  }

  // 3. Network and memory constraints
  // @ts-expect-error deviceMemory is non-standard but available in Chromium
  const deviceMemory: number | undefined = navigator.deviceMemory;
  const hardwareConcurrency: number | undefined = navigator.hardwareConcurrency;
  // @ts-expect-error connection is non-standard
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType: string | undefined = connection?.effectiveType;

  // Slow 2G/3G or low memory (< 2GB) -> poster
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || (deviceMemory !== undefined && deviceMemory < 2)) {
    return {
      tier: 'poster',
      webgl,
      webgl2,
      reducedMotion,
      deviceMemory,
      hardwareConcurrency,
      effectiveType,
    };
  }

  // Mid-spec (3G or 2-4GB memory or low core count) -> lite
  if (
    effectiveType === '3g' ||
    (deviceMemory !== undefined && deviceMemory <= 4) ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 2)
  ) {
    return {
      tier: 'lite',
      webgl,
      webgl2,
      reducedMotion,
      deviceMemory,
      hardwareConcurrency,
      effectiveType,
    };
  }

  // High-performance -> full
  return {
    tier: 'full',
    webgl,
    webgl2,
    reducedMotion,
    deviceMemory,
    hardwareConcurrency,
    effectiveType,
  };
}
