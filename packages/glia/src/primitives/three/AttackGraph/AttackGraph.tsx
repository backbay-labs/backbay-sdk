"use client";

import * as React from "react";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Line2 } from "three-stdlib";
import {
  ATTACK_CHAIN_STATUS_COLORS,
  ATTACK_DETECTION_COLORS,
  ATTACK_TACTIC_LABELS,
  ATTACK_TACTIC_ORDER,
  type AttackChain,
  type AttackGraphProps,
  type AttackTechnique,
  type AttackTactic,
} from "./types";

const TECHNIQUE_BASE_SIZE = 0.22;

function buildTechniqueIndex(chains: AttackChain[]) {
  const techniqueMap = new Map<string, AttackTechnique>();
  const chainIndexMap = new Map<string, number>();

  chains.forEach((chain, chainIndex) => {
    chain.techniques.forEach((technique) => {
      if (!techniqueMap.has(technique.id)) {
        techniqueMap.set(technique.id, technique);
      }
      if (!chainIndexMap.has(technique.id)) {
        chainIndexMap.set(technique.id, chainIndex);
      }
    });
  });

  return {
    techniques: Array.from(techniqueMap.values()),
    chainIndexMap,
  };
}

function layoutKillchain(
  techniques: AttackTechnique[],
  chainIndexMap: Map<string, number>,
  chainCount: number,
  layout: "killchain" | "matrix"
) {
  const positions = new Map<string, THREE.Vector3>();
  const tacticGroups = new Map<AttackTactic, AttackTechnique[]>();

  techniques.forEach((technique) => {
    const list = tacticGroups.get(technique.tactic) ?? [];
    list.push(technique);
    tacticGroups.set(technique.tactic, list);
  });

  const spacingX = layout === "matrix" ? 1.3 : 1.6;
  const spacingY = layout === "matrix" ? 0.7 : 0.9;
  const maxTactics = ATTACK_TACTIC_ORDER.length;

  ATTACK_TACTIC_ORDER.forEach((tactic, tacticIndex) => {
    const group = tacticGroups.get(tactic) ?? [];
    group.sort((a, b) => a.id.localeCompare(b.id));

    group.forEach((technique, index) => {
      const x = (tacticIndex - (maxTactics - 1) / 2) * spacingX;
      const y = ((group.length - 1) / 2 - index) * spacingY;
      const chainIndex = chainIndexMap.get(technique.id) ?? 0;
      const z = (chainIndex - (chainCount - 1) / 2) * 0.5;
      positions.set(technique.id, new THREE.Vector3(x, y, z));
    });
  });

  return positions;
}

function layoutTimeline(
  techniques: AttackTechnique[],
  chainIndexMap: Map<string, number>,
  chainCount: number
) {
  const positions = new Map<string, THREE.Vector3>();
  const withTimestamp = techniques.filter((technique) => technique.timestamp);
  const timelineWidth = 12;

  const timestamps = withTimestamp.map((technique) => technique.timestamp!.getTime());
  const minTime = timestamps.length ? Math.min(...timestamps) : 0;
  const maxTime = timestamps.length ? Math.max(...timestamps) : 1;
  const range = Math.max(1, maxTime - minTime);

  techniques
    .slice()
    .sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return a.id.localeCompare(b.id);
    })
    .forEach((technique, index) => {
      const timeValue = technique.timestamp ? technique.timestamp.getTime() : minTime + index * 1000;
      const x = ((timeValue - minTime) / range - 0.5) * timelineWidth;
      const chainIndex = chainIndexMap.get(technique.id) ?? 0;
      const y = (chainIndex - (chainCount - 1) / 2) * 1.2;
      positions.set(technique.id, new THREE.Vector3(x, y, 0));
    });

  return positions;
}

interface TechniqueNodeProps {
  technique: AttackTechnique;
  position: THREE.Vector3;
  isSelected: boolean;
  showMitreIds: boolean;
  highlightDetected: boolean;
  animateProgression: boolean;
  isActive: boolean;
  onClick?: (technique: AttackTechnique) => void;
}

function TechniqueNode({
  technique,
  position,
  isSelected,
  showMitreIds,
  highlightDetected,
  animateProgression,
  isActive,
  onClick,
}: TechniqueNodeProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  const baseColor = technique.detected
    ? ATTACK_DETECTION_COLORS.detected
    : ATTACK_DETECTION_COLORS.undetected;

  const baseSize = TECHNIQUE_BASE_SIZE + technique.confidence * 0.12;
  const dimmed = highlightDetected && !technique.detected;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    let pulse = 1;

    if (animateProgression && isActive) {
      pulse = 1 + Math.sin(t * 3) * 0.12;
    } else if (technique.detected) {
      pulse = 1 + Math.sin(t * 1.5) * 0.04;
    }

    meshRef.current.scale.setScalar(baseSize * pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(technique);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        scale={[baseSize, baseSize, baseSize]}
      >
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={technique.detected ? 0.8 : 0.35}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={dimmed ? 0.2 : 0.9}
        />
      </mesh>

      {(isSelected || hovered || showMitreIds) && (
        <Html distanceFactor={10} position={[0, 0.7, 0]}>
          <div className="rounded-md border border-white/[0.06] bg-[rgba(2,4,10,0.85)] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] px-2 py-1 text-[10px] uppercase tracking-wider text-white/80">
            <div className="font-semibold">
              {showMitreIds ? technique.id : "Technique"}
            </div>
            <div className="text-[9px] opacity-70">{technique.name}</div>
          </div>
        </Html>
      )}

      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.4, baseSize * 1.55, 32]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

interface ChainPathProps {
  chain: AttackChain;
  points: THREE.Vector3[];
  animate: boolean;
}

function ChainPath({ chain, points, animate }: ChainPathProps) {
  const lineRef = React.useRef<Line2>(null);
  const color = ATTACK_CHAIN_STATUS_COLORS[chain.status];
  const dashed = chain.status === "active";

  useFrame((_state, delta) => {
    if (!lineRef.current || !dashed || !animate) return;
    if (lineRef.current.material) {
      lineRef.current.material.dashOffset -= delta * 0.6;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      transparent
      opacity={chain.status === "remediated" ? 0.3 : 0.6}
      lineWidth={chain.status === "active" ? 2.5 : 1.5}
      dashed={dashed}
      dashSize={0.2}
      gapSize={0.16}
    />
  );
}

export function AttackGraph({
  chains,
  layout = "killchain",
  selectedTechnique,
  onTechniqueClick,
  showMitreIds = false,
  highlightDetected = false,
  animateProgression = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: AttackGraphProps) {
  const { techniques, chainIndexMap } = React.useMemo(() => buildTechniqueIndex(chains), [chains]);
  const chainCount = chains.length || 1;
  const labelSpacing = layout === "matrix" ? 1.3 : 1.6;

  const positions = React.useMemo(() => {
    if (layout === "timeline") {
      return layoutTimeline(techniques, chainIndexMap, chainCount);
    }
    return layoutKillchain(techniques, chainIndexMap, chainCount, layout);
  }, [techniques, chainIndexMap, chainCount, layout]);

  const activeTechniqueIds = React.useMemo(() => {
    const activeIds = new Set<string>();
    chains
      .filter((chain) => chain.status === "active")
      .forEach((chain) => {
        chain.techniques.forEach((technique) => activeIds.add(technique.id));
      });
    return activeIds;
  }, [chains]);

  return (
    <group position={position} rotation={rotation}>
      {layout !== "timeline" &&
        ATTACK_TACTIC_ORDER.map((tactic, index) => (
          <Html
            key={tactic}
            distanceFactor={15}
            position={[(index - (ATTACK_TACTIC_ORDER.length - 1) / 2) * labelSpacing, 2.6, -1]}
          >
            <div className="rounded bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/70">
              {ATTACK_TACTIC_LABELS[tactic]}
            </div>
          </Html>
        ))}

      {chains.map((chain) => {
        const points = chain.techniques
          .map((technique) => positions.get(technique.id))
          .filter(Boolean) as THREE.Vector3[];

        if (points.length < 2) return null;
        return (
          <ChainPath key={chain.id} chain={chain} points={points} animate={animateProgression} />
        );
      })}

      {techniques.map((technique) => {
        const positionVector = positions.get(technique.id);
        if (!positionVector) return null;

        return (
          <TechniqueNode
            key={technique.id}
            technique={technique}
            position={positionVector}
            isSelected={selectedTechnique === technique.id}
            showMitreIds={showMitreIds}
            highlightDetected={highlightDetected}
            animateProgression={animateProgression}
            isActive={activeTechniqueIds.has(technique.id)}
            onClick={onTechniqueClick}
          />
        );
      })}
    </group>
  );
}
