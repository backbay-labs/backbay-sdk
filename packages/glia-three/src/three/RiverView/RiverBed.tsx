"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRiverCurve, RIVER_DEFAULTS } from "./riverHelpers";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface RiverBedProps {
  /** Control points for the river path. Falls back to a default meandering curve. */
  curvePoints?: THREE.Vector3[];
  /** Width of the river surface. */
  width?: number;
  /** Risk level 0-1 — tints from cyan through amber to red. */
  riskLevel?: number;
  /** Base flow speed multiplier. */
  flowSpeed?: number;
}

// -----------------------------------------------------------------------------
// Shader Material
// -----------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlowSpeed;

  varying vec2 vUv;
  varying float vEdge;

  void main() {
    vUv = uv;
    // vEdge = 0 at centre, 1 at edges (lateral)
    vEdge = abs(uv.y - 0.5) * 2.0;

    // Gentle wave displacement on Y
    vec3 pos = position;
    float wave = sin(pos.x * 0.6 + uTime * uFlowSpeed * 1.5) * 0.04
               + sin(pos.x * 1.3 - uTime * uFlowSpeed * 0.8 + pos.z * 0.9) * 0.025;
    pos.y += wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uFlowSpeed;
  uniform float uRiskLevel;

  varying vec2 vUv;
  varying float vEdge;

  // Simple pseudo-noise
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

  void main() {
    // Scrolling UV for flow effect
    vec2 flowUv = vUv;
    flowUv.x += uTime * uFlowSpeed * 0.08;

    // Layered noise for subtle ripples
    float n = noise(flowUv * 8.0) * 0.5 + noise(flowUv * 16.0 + 3.7) * 0.25;

    // Risk-based colour ramp: cyan -> amber -> red
    vec3 cyan   = vec3(0.133, 0.827, 0.933);   // #22D3EE
    vec3 amber  = vec3(0.961, 0.620, 0.043);   // #F59E0B
    vec3 red    = vec3(0.957, 0.247, 0.369);    // #F43F5E

    vec3 baseColor;
    if (uRiskLevel < 0.5) {
      baseColor = mix(cyan, amber, uRiskLevel * 2.0);
    } else {
      baseColor = mix(amber, red, (uRiskLevel - 0.5) * 2.0);
    }

    // Dark river base with subtle coloured highlights
    vec3 riverBase = vec3(0.020, 0.031, 0.071); // ~#050812
    vec3 color = mix(riverBase, baseColor, 0.08 + n * 0.12);

    // Glow lines scrolling along the river
    float line = smoothstep(0.48, 0.50, fract(flowUv.x * 3.0 + uTime * uFlowSpeed * 0.05));
    color += baseColor * line * 0.06;

    // Edge fade
    float edgeFade = 1.0 - smoothstep(0.7, 1.0, vEdge);

    gl_FragColor = vec4(color, 0.85 * edgeFade);
  }
`;

// -----------------------------------------------------------------------------
// Geometry Builder
// -----------------------------------------------------------------------------

function buildRiverGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  segmentsAlong = 64,
  segmentsAcross = 8,
): THREE.BufferGeometry {
  const vertexCount = (segmentsAlong + 1) * (segmentsAcross + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const point = new THREE.Vector3();

  let idx = 0;
  for (let i = 0; i <= segmentsAlong; i++) {
    const t = i / segmentsAlong;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    // Perpendicular on the XZ plane
    normal.set(-tangent.z, 0, tangent.x).normalize();

    for (let j = 0; j <= segmentsAcross; j++) {
      const s = j / segmentsAcross; // 0..1 across
      const offset = (s - 0.5) * width;

      positions[idx * 3] = point.x + normal.x * offset;
      positions[idx * 3 + 1] = point.y;
      positions[idx * 3 + 2] = point.z + normal.z * offset;

      uvs[idx * 2] = t;
      uvs[idx * 2 + 1] = s;

      idx++;
    }
  }

  // Build triangle indices
  for (let i = 0; i < segmentsAlong; i++) {
    for (let j = 0; j < segmentsAcross; j++) {
      const a = i * (segmentsAcross + 1) + j;
      const b = a + 1;
      const c = a + (segmentsAcross + 1);
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// -----------------------------------------------------------------------------
// Crystalline Formations — decorative riverbank rocks
// -----------------------------------------------------------------------------

interface CrystalDef {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  geo: "icosahedron" | "octahedron";
}

/** Deterministic seed-based pseudo-random to keep formations stable across renders. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateCrystals(count: number, riverWidth: number): CrystalDef[] {
  const crystals: CrystalDef[] = [];
  const colors = ["#22D3EE", "#8B5CF6"];

  for (let i = 0; i < count; i++) {
    const r = seededRandom(i + 42);
    const side = i % 2 === 0 ? 1 : -1;
    const lateralBase = (riverWidth * 0.5 + 0.1 + r * 0.6) * side;
    const along = seededRandom(i + 7) * 16 - 8; // spread along the x-axis range
    const zOff = (seededRandom(i + 13) - 0.5) * 6;

    crystals.push({
      position: [along, -0.3 - seededRandom(i + 99) * 0.15, zOff + lateralBase * 0.3],
      rotation: [
        seededRandom(i + 1) * Math.PI,
        seededRandom(i + 2) * Math.PI,
        seededRandom(i + 3) * Math.PI,
      ],
      scale: 0.05 + seededRandom(i + 50) * 0.1,
      color: colors[i % colors.length],
      geo: i % 3 === 0 ? "octahedron" : "icosahedron",
    });
  }
  return crystals;
}

// Shared geometries for crystal formations (avoid per-render allocations)
const SHARED_ICO_GEO = new THREE.IcosahedronGeometry(1, 0);
const SHARED_OCT_GEO = new THREE.OctahedronGeometry(1, 0);
const SHARED_ICO_EDGES = new THREE.EdgesGeometry(SHARED_ICO_GEO);
const SHARED_OCT_EDGES = new THREE.EdgesGeometry(SHARED_OCT_GEO);

function CrystalFormations({ riverWidth }: { riverWidth: number }) {
  const crystals = React.useMemo(() => generateCrystals(10, riverWidth), [riverWidth]);

  return (
    <group>
      {crystals.map((c, i) => (
        <group key={i} position={c.position} rotation={c.rotation} scale={c.scale}>
          <mesh geometry={c.geo === "icosahedron" ? SHARED_ICO_GEO : SHARED_OCT_GEO}>
            <meshStandardMaterial
              color={c.color}
              metalness={0.3}
              roughness={0.3}
              emissive={c.color}
              emissiveIntensity={0.08}
              transparent
              opacity={0.6}
            />
          </mesh>
          <lineSegments geometry={c.geo === "icosahedron" ? SHARED_ICO_EDGES : SHARED_OCT_EDGES}>
            <lineBasicMaterial
              color={c.color}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function RiverBed({
  curvePoints,
  width = RIVER_DEFAULTS.width,
  riskLevel = 0,
  flowSpeed = RIVER_DEFAULTS.flowSpeed,
}: RiverBedProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  const curve = React.useMemo(() => {
    if (curvePoints && curvePoints.length >= 2) {
      return new THREE.CatmullRomCurve3(curvePoints);
    }
    return createRiverCurve();
  }, [curvePoints]);

  const geometry = React.useMemo(
    () => buildRiverGeometry(curve, width),
    [curve, width],
  );

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uFlowSpeed: { value: flowSpeed },
      uRiskLevel: { value: riskLevel },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Animate uniforms
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uFlowSpeed.value = flowSpeed;
    uniforms.uRiskLevel.value = riskLevel;
  });

  return (
    <group>
      {/* Main river surface */}
      <mesh ref={meshRef} geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle additive glow beneath */}
      <mesh geometry={geometry} position={[0, -0.02, 0]}>
        <meshBasicMaterial
          color="#22D3EE"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Decorative crystalline formations along the riverbanks */}
      <CrystalFormations riverWidth={width} />

      {/* Subtle ground grid beneath the river */}
      <gridHelper args={[20, 40, "#0a0f1a", "#0a0f1a"]} position={[0, -0.5, 0]} />
    </group>
  );
}

RiverBed.displayName = "RiverBed";
