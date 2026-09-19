'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { threadVertexShader, threadFragmentShader, createThreadUniforms } from './shaders';
import type { RenderingTier } from './probe';

interface ThreadMeshProps {
  progress: number;
  tier: RenderingTier;
  onFrame?: () => void;
}

export function ThreadMesh({ progress, tier }: ThreadMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => createThreadUniforms(), []);

  // Spring animation state
  const currentResolve = useRef(progress);
  const currentHead = useRef(progress);

  // Curve geometry: spline from left (-2.2) to right (+2.2)
  const { geometry, curve, milestonePoints } = useMemo(() => {
    const points = [
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(-1.1, 0.25, -0.1),
      new THREE.Vector3(0, -0.18, 0.12),
      new THREE.Vector3(1.1, 0.15, -0.05),
      new THREE.Vector3(2.2, 0, 0),
    ];

    const c = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const tubularSegments = tier === 'lite' ? 48 : 120;
    const radialSegments = tier === 'lite' ? 6 : 16;
    const tubeRadius = tier === 'lite' ? 0.05 : 0.065;

    const geom = new THREE.TubeGeometry(c, tubularSegments, tubeRadius, radialSegments, false);

    // Sample milestone points along curve for milestone spheres
    const milestones = [
      c.getPointAt(0.0),   // Intent
      c.getPointAt(0.33),  // Profile
      c.getPointAt(0.66),  // Options
      c.getPointAt(1.0),   // Sanction
    ];

    return { geometry: geom, curve: c, milestonePoints: milestones };
  }, [tier]);

  // Glowing particle dust around thread
  const particleGeometry = useMemo(() => {
    const particleCount = tier === 'lite' ? 30 : 75;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color('#22D3EE');
    const teal = new THREE.Color('#14B8A6');
    const orange = new THREE.Color('#F59E0B');

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = curve.getPointAt(t);

      // Jitter around the spline
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.12 + Math.random() * 0.22;
      positions[i * 3] = pt.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = pt.y + Math.sin(angle) * radius;
      positions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.2;

      // Color blends from warm orange through cyan to teal
      const col = t < 0.5
        ? orange.clone().lerp(cyan, t * 2)
        : cyan.clone().lerp(teal, (t - 0.5) * 2);

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return pGeom;
  }, [curve, tier]);

  useFrame((state, delta) => {
    const u = materialRef.current?.uniforms;
    if (!u || !u['uTime'] || !u['uResolve'] || !u['uHead']) return;

    // Smooth spring towards target progress
    const springSpeed = 4.0;
    currentResolve.current += (progress - currentResolve.current) * Math.min(1, delta * springSpeed);
    currentHead.current += (progress - currentHead.current) * Math.min(1, delta * (springSpeed * 1.5));

    const time = state.clock.getElapsedTime();
    u['uTime'].value = time;
    u['uResolve'].value = currentResolve.current;
    u['uHead'].value = currentHead.current;

    // Interactive mouse parallax tilt
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        state.pointer.x * 0.25,
        0.06
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -state.pointer.y * 0.18,
        0.06
      );
    }

    // Subtle drift on particles
    if (particlesRef.current) {
      particlesRef.current.rotation.x = Math.sin(time * 0.5) * 0.05;
      particlesRef.current.rotation.y = time * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Thread Tube */}
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={threadVertexShader}
          fragmentShader={threadFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating Ambient Glowing Particles */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={tier === 'lite' ? 0.04 : 0.055}
          vertexColors
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Milestone Spheres & Pulsing Halos */}
      {milestonePoints.map((pos, idx) => {
        const threshold = idx * 0.33;
        const isReached = progress >= threshold;
        const color = isReached ? '#10B981' : '#64748B';
        const scale = isReached ? 0.11 : 0.07;

        return (
          <group key={idx} position={pos}>
            {/* Core sphere */}
            <mesh>
              <sphereGeometry args={[scale, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={isReached ? '#22D3EE' : '#000000'}
                emissiveIntensity={isReached ? 0.6 : 0.0}
                roughness={0.25}
                metalness={0.4}
              />
            </mesh>

            {/* Glowing ring halo for active/reached milestone */}
            {isReached && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[scale * 1.35, scale * 1.7, 24]} />
                <meshBasicMaterial
                  color="#22D3EE"
                  transparent
                  opacity={0.4}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

