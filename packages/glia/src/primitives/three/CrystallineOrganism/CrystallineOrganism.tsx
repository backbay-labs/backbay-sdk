/**
 * CrystallineOrganism
 *
 * Emotion-driven crystalline primitive for visualizing units of work
 * (kernel, workcell, agent, task) in the Backbay Nexus.
 *
 * Uses the same AVO emotion system as the Glyph, but renders as faceted
 * platonic solids with glowing edges instead of a loaded GLB model.
 */

import { useRef, useCallback, useState, useMemo } from "react";
import { Html } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { CrystallineOrganismProps } from "./types";
import { POWER_MULTIPLIERS } from "./types";
import { ORGANISM_BASE_SIZE } from "./constants";
import { OrganismShell } from "./OrganismShell";
import { OrganismParticles } from "./OrganismParticles";
import { useOrganismEmotion } from "./useOrganismEmotion";

export function CrystallineOrganism({
  id,
  type,
  label,
  state = "idle",
  dimensions,
  visualState: directVisualState,
  power = "standard",
  children,
  sprawled = false,
  selected = false,
  hovered = false,
  onSelect,
  onSprawl,
  onCollapse,
  onContextMenu,
  onHover,
  position = [0, 0, 0],
  enableParticles = true,
}: CrystallineOrganismProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isLocalHovered, setIsLocalHovered] = useState(false);

  // Get emotion-driven visual state
  const { visualState } = useOrganismEmotion({
    state,
    dimensions,
    visualState: directVisualState,
  });

  // Calculate size based on type and power level
  const baseSize = ORGANISM_BASE_SIZE[type];
  const powerMultiplier = POWER_MULTIPLIERS[power];
  const size = baseSize * powerMultiplier.scale;

  // Adjust particle count by power level
  const adjustedVisualState = useMemo(() => ({
    ...visualState,
    particleCount: Math.floor(visualState.particleCount * powerMultiplier.particles),
  }), [visualState, powerMultiplier.particles]);

  const effectiveHovered = hovered || isLocalHovered;

  // Derive colors from emotion state for labels
  const { labelColor, typeColor } = useMemo(() => {
    const hue = visualState.coreHue / 360;
    const sat = visualState.coreSaturation;
    return {
      labelColor: new THREE.Color().setHSL(hue, sat * 0.8, 0.7).getStyle(),
      typeColor: new THREE.Color().setHSL(hue, sat, 0.6).getStyle(),
    };
  }, [visualState.coreHue, visualState.coreSaturation]);

  // Handle click - select or sprawl depending on whether it has children
  const handleClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (children && children.length > 0 && !sprawled) {
        onSprawl?.(id);
      } else {
        onSelect?.(id);
      }
    },
    [id, children, sprawled, onSprawl, onSelect]
  );

  const handleDoubleClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (sprawled) {
        onCollapse?.(id);
      } else if (children && children.length > 0) {
        onSprawl?.(id);
      }
    },
    [id, sprawled, children, onSprawl, onCollapse]
  );

  const handleContextMenu = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const pos = groupRef.current?.position ?? new THREE.Vector3();
      onContextMenu?.(id, pos);
    },
    [id, onContextMenu]
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsLocalHovered(true);
      onHover?.(id);
      document.body.style.cursor = "pointer";
    },
    [id, onHover]
  );

  const handlePointerOut = useCallback(() => {
    setIsLocalHovered(false);
    onHover?.(null);
    document.body.style.cursor = "auto";
  }, [onHover]);

  // Animate position
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetPos = new THREE.Vector3(...position);
    group.position.lerp(targetPos, 1 - Math.exp(-delta * 8));
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Interaction mesh - invisible but clickable */}
      <mesh
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Crystalline shell with emotion-driven visuals */}
      <OrganismShell
        type={type}
        visualState={adjustedVisualState}
        size={size}
        selected={selected}
        hovered={effectiveHovered}
      />

      {/* Particle aura */}
      {enableParticles && (
        <OrganismParticles
          visualState={adjustedVisualState}
          shellRadius={size}
        />
      )}

      {/* Label */}
      {label && (effectiveHovered || selected) && (
        <Html
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `translateY(${-size * 40 - 12}px)`,
              animation: "fadeIn 0.15s ease-out",
            }}
          >
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "9999px",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px)",
                backgroundColor: "rgba(2,4,10,0.85)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  color: "white",
                }}
              >
                {label}
              </div>
            </div>

            {/* Type chip */}
            <div
              style={{
                fontSize: "7px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 700,
                marginTop: "4px",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(2,4,10,0.85)",
                backdropFilter: "blur(24px)",
                color: typeColor,
                boxShadow: `0 0 6px ${typeColor}22, inset 0 1px 0 rgba(255,255,255,0.02)`,
              }}
            >
              {type}
            </div>

            {/* State indicator (when not idle) */}
            {state !== "idle" && (
              <div
                style={{
                  fontSize: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginTop: "2px",
                  padding: "1px 4px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(2,4,10,0.85)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: state === "error" ? "#F43F5E" :
                         state === "busy" ? "#ffaa00" :
                         state === "thinking" ? "#22D3EE" :
                         "rgba(255,255,255,0.6)",
                }}
              >
                {state}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Children count indicator when not sprawled */}
      {children && children.length > 0 && !sprawled && (
        <Html
          distanceFactor={16}
          zIndexRange={[50, 0]}
          style={{ pointerEvents: "none" }}
          position={[0, -size * 1.2, 0]}
        >
          <div
            style={{
              fontSize: "8px",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.5)",
              backgroundColor: "rgba(2,4,10,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
              padding: "0 4px",
              borderRadius: "4px",
            }}
          >
            +{children.length}
          </div>
        </Html>
      )}
    </group>
  );
}
