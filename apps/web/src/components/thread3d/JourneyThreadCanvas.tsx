'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useJourneyStore } from '../../stores/journeyStore';
import { detectRenderingTier, type RenderingTier } from './probe';
import { ThreadMesh } from './ThreadMesh';
import { ThreadIndicator } from '../journey/ThreadIndicator';

export function JourneyThreadCanvas({ className = '' }: { className?: string }) {
  const { progress } = useJourneyStore();
  const [tier, setTier] = useState<RenderingTier | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Probe hardware & WebGL capability on mount
  useEffect(() => {
    const caps = detectRenderingTier();
    setTier(caps.tier);

    // Page Visibility API: pause when tab inactive to save battery
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // IntersectionObserver: pause if scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  // SSR or before probe completes: render 2D SVG fallback
  if (!tier || tier === 'poster') {
    return <ThreadIndicator className={className} />;
  }

  const pct = Math.round(progress * 100);

  return (
    <div ref={containerRef} className={`flex flex-col gap-2 ${className}`} aria-label={`3D Journey Thread: ${pct}% resolved`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--text-primary)]">Journey Thread (3D)</span>
        <span className="tabular-nums font-medium text-[var(--color-signal-cyan)]">{pct}% Resolved</span>
      </div>

      <div className="relative h-20 w-full bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-inner">
        {isVisible ? (
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 45 }}
            gl={{ antialias: tier === 'full', alpha: true, powerPreference: 'low-power' }}
            dpr={tier === 'full' ? [1, 2] : 1}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <pointLight position={[-2, 0, 2]} intensity={0.6} color="#F59E0B" />
            <pointLight position={[2, 0, 2]} intensity={0.6} color="#22D3EE" />
            <ThreadMesh progress={progress} tier={tier} />
          </Canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">
            Paused (Background)
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] text-[var(--text-secondary)] px-1">
        <span>Intent</span>
        <span>Profile</span>
        <span>Options</span>
        <span>Apply</span>
      </div>
    </div>
  );
}
