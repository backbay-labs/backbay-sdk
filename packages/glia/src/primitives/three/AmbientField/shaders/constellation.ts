/**
 * Constellation Style Shaders
 *
 * A faint lattice with iridescent interference, harmonic burst rings,
 * and constellation-like points that brighten near interactions.
 */

import * as THREE from "three";
import type { FieldUniforms } from "../types";

// -----------------------------------------------------------------------------
// Vertex Shader
// -----------------------------------------------------------------------------

export const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// -----------------------------------------------------------------------------
// Fragment Shader
// -----------------------------------------------------------------------------

export const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;
uniform vec4 uHover;
uniform vec4 uImpulses[24];
uniform float uImpulsesAge[24];
uniform int uImpulseCount;
uniform vec4 uAnchors[8];
uniform vec4 uAnchorColors[8];
uniform int uAnchorCount;
uniform float uProbeRadius;

varying vec2 vUv;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Noise functions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Hex lattice
float hexDist(vec2 p) {
  p = abs(p);
  return max(p.x, dot(p, vec2(0.5, 0.866025)));
}

float hexLattice(vec2 uv, float scale) {
  uv *= scale;
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  return min(hexDist(a), hexDist(b));
}

// Shapes
float circle(vec2 uv, vec2 center, float radius, float softness) {
  float d = length(uv - center);
  return 1.0 - smoothstep(radius - softness, radius + softness, d);
}

float ring(vec2 uv, vec2 center, float radius, float thickness, float softness) {
  float d = length(uv - center);
  float inner = smoothstep(radius - thickness - softness, radius - thickness, d);
  float outer = 1.0 - smoothstep(radius, radius + softness, d);
  return inner * outer;
}

// Iridescence
vec3 iridescence(float t, float intensity) {
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.0, 0.33, 0.67);
  return a + b * cos(TAU * (c * t + d)) * intensity;
}

void main() {
  vec2 uv = vUv;

  // Base: dark with subtle hex lattice
  vec3 baseColor = vec3(0.01, 0.015, 0.025);

  float hexVal = hexLattice(uv, 12.0);
  float hexLine = smoothstep(0.06, 0.03, hexVal);
  float latticeBase = hexLine * 0.03;
  vec3 latticeColor = vec3(0.1, 0.3, 0.4) * latticeBase;

  float drift = fbm(uv * 3.0 + uTime * 0.1) * 0.015;
  vec3 color = baseColor + latticeColor + drift;

  // Hover probe effect
  if (uHover.w > 0.5) {
    vec2 hoverUv = uHover.xy;
    float isEtch = uHover.z;
    float hoverDist = length(uv - hoverUv);

    float revealZone = 1.0 - smoothstep(uProbeRadius * 0.5, uProbeRadius * 1.5, hoverDist);
    float revealedLattice = hexLine * revealZone;
    vec3 revealColor = isEtch > 0.5
      ? vec3(0.9, 0.2, 0.5)
      : vec3(0.1, 0.9, 0.95);

    color += revealColor * revealedLattice * (isEtch > 0.5 ? 0.5 : 0.3);

    float centralGlow = circle(uv, hoverUv, uProbeRadius * 0.3, uProbeRadius * 0.2);
    color += revealColor * centralGlow * (isEtch > 0.5 ? 0.4 : 0.2);

    float interference = sin((hoverDist - uTime * 0.3) * 40.0) * 0.5 + 0.5;
    vec3 iriColor = iridescence(interference + hoverDist * 2.0, 0.4);
    float iriZone = smoothstep(uProbeRadius * 1.5, uProbeRadius * 0.3, hoverDist);
    color += iriColor * iriZone * 0.15;
  }

  // Impulse rings
  for (int i = 0; i < 24; i++) {
    if (i >= uImpulseCount) break;

    vec4 imp = uImpulses[i];
    float age = uImpulsesAge[i];
    if (age >= 1.0) continue;

    vec2 impUv = imp.xy;
    float baseRadius = imp.z;
    float amp = imp.w;

    float expandedRadius = baseRadius + age * 0.35;
    float thickness = 0.008 + (1.0 - age) * 0.015;
    float primaryRing = ring(uv, impUv, expandedRadius, thickness, 0.003);
    float secondaryRing = ring(uv, impUv, expandedRadius * 0.7, thickness * 0.7, 0.002);

    float fade = (1.0 - age * age) * amp;
    float dist = length(uv - impUv);
    float interference = sin((dist - uTime * 0.8) * 80.0) * 0.5 + 0.5;
    vec3 ringColor = iridescence(interference + age, 0.7);

    color += ringColor * primaryRing * fade;
    color += ringColor * secondaryRing * fade * 0.5;

    float flash = (1.0 - age) * (1.0 - age);
    float flashGlow = circle(uv, impUv, baseRadius * (1.0 - age * 0.5), 0.02);
    color += vec3(1.0, 0.9, 0.95) * flashGlow * flash * amp * 0.3;
  }

  // Anchors
  for (int i = 0; i < 8; i++) {
    if (i >= uAnchorCount) break;

    vec4 anchor = uAnchors[i];
    vec4 anchorColor = uAnchorColors[i];
    vec2 anchorUv = anchor.xy;
    float strength = anchor.z;
    float phase = anchor.w;

    float anchorDist = length(uv - anchorUv);

    float pulse = 0.6 + 0.4 * sin(uTime * 2.5 + phase);
    float coreGlow = circle(uv, anchorUv, 0.025, 0.015) * strength * pulse;

    float halo1 = ring(uv, anchorUv, 0.04 + sin(uTime * 1.5 + phase) * 0.01, 0.003, 0.002);
    float halo2 = ring(uv, anchorUv, 0.06 + cos(uTime * 1.2 + phase) * 0.01, 0.002, 0.002);

    float activationZone = smoothstep(0.12, 0.03, anchorDist);
    float activatedLattice = hexLine * activationZone * strength;

    vec3 aColor = anchorColor.rgb;
    color += aColor * coreGlow;
    color += aColor * (halo1 + halo2) * strength * pulse * 0.6;
    color += aColor * activatedLattice * 0.2;
  }

  // Vignette
  vec2 vignetteUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.15;
  color *= vignette;

  color = pow(color, vec3(0.95));

  gl_FragColor = vec4(color, 1.0);
}
`;

// -----------------------------------------------------------------------------
// Points Shaders
// -----------------------------------------------------------------------------

export const POINTS_VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform vec4 uHover;
uniform vec4 uAnchors[8];
uniform int uAnchorCount;
uniform float uProbeRadius;

attribute float aPhase;
attribute float aSize;

varying float vBrightness;
varying float vPhase;

void main() {
  vec3 pos = position;
  vec2 posUv = pos.xy * 0.5 + 0.5;

  float brightness = 0.3;

  if (uHover.w > 0.5) {
    float hoverDist = length(posUv - uHover.xy);
    float hoverBoost = 1.0 - smoothstep(uProbeRadius * 0.5, uProbeRadius * 2.0, hoverDist);
    brightness += hoverBoost * 0.7;
    vec2 toHover = uHover.xy - posUv;
    pos.xy += toHover * hoverBoost * 0.02;
  }

  for (int i = 0; i < 8; i++) {
    if (i >= uAnchorCount) break;
    vec2 anchorUv = uAnchors[i].xy;
    float strength = uAnchors[i].z;
    float anchorDist = length(posUv - anchorUv);
    float anchorBoost = 1.0 - smoothstep(0.05, 0.15, anchorDist);
    brightness += anchorBoost * strength * 0.5;
  }

  float drift = sin(uTime * 0.5 + aPhase * 6.28) * 0.003;
  pos.xy += drift;

  vBrightness = brightness;
  vPhase = aPhase;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float baseSizeScale = aSize * (0.8 + brightness * 0.4);
  gl_PointSize = baseSizeScale * (300.0 / -mvPosition.z);
}
`;

export const POINTS_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;

varying float vBrightness;
varying float vPhase;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  float twinkle = 0.7 + 0.3 * sin(uTime * 3.0 + vPhase * 6.28);

  vec3 color = mix(
    vec3(0.15, 0.4, 0.5),
    vec3(0.4, 0.95, 1.0),
    vBrightness
  );

  if (vBrightness > 0.7) {
    color = mix(color, vec3(1.0, 0.9, 0.8), (vBrightness - 0.7) * 2.0);
  }

  gl_FragColor = vec4(color, alpha * vBrightness * twinkle);
}
`;

// -----------------------------------------------------------------------------
// Uniform Factory
// -----------------------------------------------------------------------------

export function createFieldUniforms(): FieldUniforms {
  return {
    uTime: { value: 0 },
    uResolution: { value: { x: 1920, y: 1080 } },
    uHover: { value: { x: 0.5, y: 0.5, z: 0, w: 0 } },
    uImpulses: {
      value: Array(24).fill(null).map(() => ({ x: 0, y: 0, z: 0, w: 0 })),
    },
    uImpulsesAge: { value: new Float32Array(24) },
    uImpulseCount: { value: 0 },
    uAnchors: {
      value: Array(8).fill(null).map(() => ({ x: 0, y: 0, z: 0, w: 0 })),
    },
    uAnchorColors: {
      value: Array(8).fill(null).map(() => ({ x: 0, y: 1, z: 1, w: 1 })),
    },
    uAnchorCount: { value: 0 },
    uProbeRadius: { value: 0.08 },
  };
}

// -----------------------------------------------------------------------------
// Material Factories
// -----------------------------------------------------------------------------

export function createPlaneMaterial(uniforms: FieldUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    depthWrite: false,
  });
}

export function createPointsMaterial(uniforms: FieldUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: POINTS_VERTEX_SHADER,
    fragmentShader: POINTS_FRAGMENT_SHADER,
    uniforms: {
      uTime: uniforms.uTime,
      uHover: uniforms.uHover,
      uAnchors: uniforms.uAnchors,
      uAnchorCount: uniforms.uAnchorCount,
      uProbeRadius: uniforms.uProbeRadius,
    } as unknown as Record<string, THREE.IUniform>,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// -----------------------------------------------------------------------------
// Geometry Factory
// -----------------------------------------------------------------------------

export function createPointsGeometry(
  count: number,
  planeWidth: number,
  planeHeight: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * planeWidth;
    positions[i * 3 + 1] = (Math.random() - 0.5) * planeHeight;
    positions[i * 3 + 2] = 0.01;

    phases[i] = Math.random();
    sizes[i] = 1.0 + Math.random() * 2.0;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  return geometry;
}
