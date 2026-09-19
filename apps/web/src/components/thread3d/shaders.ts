import * as THREE from 'three';

export const threadVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uResolve;
  uniform float uHead;
  varying vec2 vUv;
  varying float vHeadDistance;

  void main() {
    vUv = uv;
    
    // Morph calculation:
    // When uResolve is 0.0, apply helical knot displacement
    // When uResolve is 1.0, displacement collapses to 0.0 (smooth straight path)
    float tangleFactor = 1.0 - uResolve;
    
    // Wave frequency along thread
    float freq = 3.14159 * 4.0;
    float phase = uv.x * freq + uTime * 0.8;
    
    vec3 displaced = position;
    // Displace along Y and Z based on tangleFactor and position
    displaced.y += sin(phase) * 0.4 * tangleFactor * sin(uv.x * 3.14159);
    displaced.z += cos(phase * 1.5) * 0.3 * tangleFactor * sin(uv.x * 3.14159);
    
    // Pulse expansion around uHead position
    float headDist = abs(uv.x - uHead);
    vHeadDistance = headDist;
    float pulse = smoothstep(0.12, 0.0, headDist) * 0.15;
    displaced += normal * pulse;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

export const threadFragmentShader = /* glsl */ `
  uniform vec3 uColorTangledStart;
  uniform vec3 uColorTangledEnd;
  uniform vec3 uColorClarityStart;
  uniform vec3 uColorClarityEnd;
  uniform vec3 uColorResolved;
  uniform vec3 uColorUnresolved;
  uniform float uResolve;
  uniform float uHead;
  varying vec2 vUv;
  varying float vHeadDistance;

  void main() {
    // Tangled state: Warm Orange #F59E0B -> Tangerine #FB923C
    vec3 tangledColor = mix(uColorTangledStart, uColorTangledEnd, vUv.x);
    // Clarity state: Cyan #22D3EE -> Bright Teal #14B8A6
    vec3 clarityColor = mix(uColorClarityStart, uColorClarityEnd, vUv.x);

    // Blend along resolve progress: resolved zone is cyan/teal, ahead is warm orange
    float resolvedZone = smoothstep(uResolve - 0.08, uResolve + 0.04, vUv.x);
    vec3 baseColor = mix(clarityColor, tangledColor, resolvedZone);

    // Glowing head pulse at the untangling boundary
    float pulseGlow = smoothstep(0.12, 0.0, vHeadDistance) * 0.75;
    vec3 finalColor = baseColor + vec3(0.9, 0.98, 1.0) * pulseGlow;

    gl_FragColor = vec4(finalColor, 0.96);
  }
`;

export function createThreadUniforms() {
  return {
    uTime: { value: 0.0 },
    uResolve: { value: 0.1 },
    uHead: { value: 0.0 },
    uColorTangledStart: { value: new THREE.Color('#F59E0B') }, // Warm Orange
    uColorTangledEnd:   { value: new THREE.Color('#FB923C') }, // Tangerine
    uColorClarityStart: { value: new THREE.Color('#22D3EE') }, // Cyan Clarity
    uColorClarityEnd:   { value: new THREE.Color('#14B8A6') }, // Teal
    uColorResolved:     { value: new THREE.Color('#14B8A6') },
    uColorUnresolved:   { value: new THREE.Color('#F59E0B') },
  };
}

