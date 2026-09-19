'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { detectRenderingTier, type RenderingTier } from './probe';

export function LandingThread3D({ className = '' }: { className?: string }) {
  const [tier, setTier] = useState<RenderingTier | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const caps = detectRenderingTier();
    setTier(caps.tier);
  }, []);

  if (!mounted || !tier || tier === 'poster') {
    return <Fallback3DPill className={className} />;
  }

  return (
    <div className={`relative w-64 h-64 md:w-80 md:h-80 select-none ${className}`} aria-hidden="true">
      {/* Background glow radial using signature Orange to Cyan gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#F59E0B]/20 via-transparent to-[#22D3EE]/25 rounded-full filter blur-2xl pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ antialias: tier === 'full', alpha: true, powerPreference: 'low-power' }}
        dpr={tier === 'full' ? [1, 2] : 1}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <pointLight position={[-4, -3, 3]} intensity={1.0} color="#F59E0B" />
        <pointLight position={[4, 3, 2]} intensity={1.0} color="#22D3EE" />

        <HeroInteractiveKnot tier={tier} />
      </Canvas>
    </div>
  );
}

function HeroInteractiveKnot({ tier }: { tier: RenderingTier }) {
  const groupRef = useRef<THREE.Group>(null);
  const knotRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate torus knot geometry
  const knotGeometry = useMemo(() => {
    // p=2, q=3 is standard classic elegant trefoil knot
    const tubularSegments = tier === 'lite' ? 80 : 160;
    const radialSegments = tier === 'lite' ? 12 : 24;
    return new THREE.TorusKnotGeometry(1.15, 0.22, tubularSegments, radialSegments, 2, 3);
  }, [tier]);

  // Generate swirling particle field around knot in Sahaj palette
  const particleGeom = useMemo(() => {
    const count = tier === 'lite' ? 60 : 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorCyan = new THREE.Color('#22D3EE');
    const colorOrange = new THREE.Color('#F59E0B');
    const colorTeal = new THREE.Color('#14B8A6');
    const colorAmber = new THREE.Color('#FBBF24');

    for (let i = 0; i < count; i++) {
      const radius = 1.6 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const r = Math.random();
      const col = r < 0.35 ? colorOrange : r < 0.7 ? colorCyan : r < 0.85 ? colorTeal : colorAmber;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [tier]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Constant slow mesmerizing spin
    if (knotRef.current) {
      knotRef.current.rotation.x = t * 0.25;
      knotRef.current.rotation.y = t * 0.35;
    }

    // Interactive pointer parallax
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        state.pointer.x * 0.45,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -state.pointer.y * 0.35,
        0.05
      );
    }

    // Orbiting particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -t * 0.12;
      particlesRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Organic 3D Knot in Deep Teal with Cyan clarity sheen */}
      <mesh ref={knotRef} geometry={knotGeometry}>
        <meshPhysicalMaterial
          color="#0F766E"
          emissive="#14B8A6"
          emissiveIntensity={0.25}
          roughness={0.25}
          metalness={0.6}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
          reflectivity={0.85}
        />
      </mesh>

      {/* Orbiting glowing particles */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          size={tier === 'lite' ? 0.05 : 0.065}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Fallback3DPill({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-48 h-48 md:w-64 md:h-64 flex items-center justify-center animate-[thread-idle_6s_ease-in-out_infinite] ${className}`}
    >
      <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[var(--color-signal-cyan)] to-[var(--color-saffron-thread)] p-1 shadow-xl shadow-[var(--color-signal-cyan)]/20 animate-pulse">
        <div className="w-full h-full rounded-full bg-[var(--bg-page)] flex items-center justify-center">
          <span className="font-display font-bold text-2xl text-[var(--color-signal-cyan)]">सहज</span>
        </div>
      </div>
    </div>
  );
}
