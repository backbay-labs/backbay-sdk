"use client";

import * as React from "react";
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  FIREWALL_ACTION_COLORS,
  FIREWALL_TRAFFIC_COLORS,
  type FirewallBarrierProps,
  type FirewallRule,
  type FirewallTraffic,
} from "./types";

interface SegmentLayout {
  rule: FirewallRule;
  position: [number, number, number];
  size: [number, number, number];
}

function buildSegmentLayout(rules: FirewallRule[]) {
  const columns = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(rules.length))));
  const rows = Math.ceil(rules.length / columns);
  const cellWidth = 1.2;
  const cellHeight = 0.6;
  const depth = 0.2;

  const segments: SegmentLayout[] = rules.map((rule, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = (col - (columns - 1) / 2) * cellWidth;
    const y = ((rows - 1) / 2 - row) * cellHeight;
    return {
      rule,
      position: [x, y, 0],
      size: [cellWidth * 0.85, cellHeight * 0.75, depth],
    };
  });

  return {
    segments,
    columns,
    rows,
    width: columns * cellWidth,
    height: rows * cellHeight,
    depth,
  };
}

interface RuleSegmentProps {
  rule: FirewallRule;
  position: [number, number, number];
  size: [number, number, number];
  showLabel: boolean;
  blockedColor?: string;
  allowedColor?: string;
  onClick?: (rule: FirewallRule) => void;
}

function RuleSegment({
  rule,
  position,
  size,
  showLabel,
  blockedColor,
  allowedColor,
  onClick,
}: RuleSegmentProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  const baseColor =
    rule.action === "deny"
      ? blockedColor ?? FIREWALL_ACTION_COLORS.deny
      : rule.action === "allow"
        ? allowedColor ?? FIREWALL_ACTION_COLORS.allow
        : FIREWALL_ACTION_COLORS.log;

  const hitIntensity = Math.min(1, rule.hits / 200);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 2 + rule.hits * 0.01) * (0.05 + hitIntensity * 0.15);
    meshRef.current.scale.setScalar(hovered ? 1.05 : pulse);
  });

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.05}
        smoothness={4}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(rule);
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
      >
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.4 + hitIntensity * 0.8}
          transparent
          opacity={rule.action === "deny" ? 0.85 : 0.6}
          roughness={0.3}
          metalness={0.5}
        />
      </RoundedBox>

      {showLabel && (
        <Html distanceFactor={10} position={[0, size[1] * 0.8, 0]}>
          <div className="rounded bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] px-2 py-1 text-[9px] uppercase tracking-wider text-white/80">
            <div className="font-semibold">{rule.name}</div>
            <div className="text-[8px] opacity-70">
              {rule.action.toUpperCase()} • {rule.protocol.toUpperCase()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface TrafficParticleProps {
  event: FirewallTraffic;
  basePosition: [number, number, number];
  orientation: "vertical" | "horizontal";
  animate: boolean;
  index: number;
}

function TrafficParticle({
  event,
  basePosition,
  orientation,
  animate,
  index,
}: TrafficParticleProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const color = FIREWALL_TRAFFIC_COLORS[event.action];
  const phase = (index % 6) / 6;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const t = clock.elapsedTime * 0.6 + phase;
    const progress = t % 1;
    const travel = event.action === "blocked" ? Math.min(progress, 0.5) : progress;

    if (orientation === "vertical") {
      const z = THREE.MathUtils.lerp(-2.2, 2.2, travel);
      meshRef.current.position.set(basePosition[0], basePosition[1], z);
    } else {
      const y = THREE.MathUtils.lerp(-2.2, 2.2, travel);
      meshRef.current.position.set(basePosition[0], y, basePosition[1]);
    }

    meshRef.current.visible = animate;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export function FirewallBarrier({
  rules,
  recentTraffic = [],
  orientation = "vertical",
  showRuleLabels = true,
  animateTraffic = true,
  onRuleClick,
  blockedColor,
  allowedColor,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: FirewallBarrierProps) {
  const layout = React.useMemo(() => buildSegmentLayout(rules), [rules]);

  const rulePositionMap = React.useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    layout.segments.forEach((segment) => {
      map.set(segment.rule.id, segment.position);
    });
    return map;
  }, [layout.segments]);

  const barrierRotation: [number, number, number] =
    orientation === "horizontal" ? [Math.PI / 2, 0, 0] : [0, 0, 0];

  const barrierSize: [number, number] =
    orientation === "horizontal"
      ? [layout.width + 0.5, layout.height + 0.5]
      : [layout.width + 0.5, layout.height + 0.5];

  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={barrierRotation}>
        <planeGeometry args={barrierSize} />
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.3}
          emissive="#0b1f3a"
          emissiveIntensity={0.25}
          roughness={0.8}
        />
      </mesh>

      <group rotation={barrierRotation}>
        {layout.segments.map((segment) => (
          <RuleSegment
            key={segment.rule.id}
            rule={segment.rule}
            position={segment.position}
            size={segment.size}
            showLabel={showRuleLabels}
            blockedColor={blockedColor}
            allowedColor={allowedColor}
            onClick={onRuleClick}
          />
        ))}
      </group>

      {recentTraffic.map((event, index) => {
        const basePosition = rulePositionMap.get(event.ruleId ?? "") ?? [0, 0, 0];
        return (
          <TrafficParticle
            key={event.id}
            event={event}
            basePosition={basePosition}
            orientation={orientation}
            animate={animateTraffic}
            index={index}
          />
        );
      })}
    </group>
  );
}
