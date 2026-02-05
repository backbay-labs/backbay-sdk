'use client';

/**
 * AvatarRenderer - Placeholder Three.js avatar for Sentinel
 *
 * This component renders a stylized avatar head using an injected GlyphRenderer.
 * It is designed to be driven by Avatar Forcing model output in the future.
 *
 * Future integration points:
 * - blendshapes: Record<string, number> for facial expressions (ARKit-compatible)
 *   e.g., { browInnerUp: 0.5, mouthSmile_L: 0.3, eyeWide_L: 0.2, ... }
 * - headPose: [rx, ry, rz] for head rotation in radians
 * - WebSocket connection: Real-time updates from Avatar Forcing inference server
 *   Expected message format: { blendshapes: Record<string, number>, headPose: [number, number, number], timestamp: number }
 */

import { Canvas, useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';
import type { Group } from 'three';

import type { AvatarRendererProps } from './types';
import { useSentinelDependencies } from './SentinelProvider';

// -----------------------------------------------------------------------------
// Animation Configuration
// -----------------------------------------------------------------------------

const LERP_FACTOR = 0.15; // Smoothing factor for interpolation (0-1, lower = smoother)

// -----------------------------------------------------------------------------
// Animation Wrapper
// -----------------------------------------------------------------------------

interface AnimationWrapperProps {
  isActive: boolean;
  headPose?: [number, number, number];
  children: React.ReactNode;
}

/**
 * Wraps the avatar with animation.
 * When headPose is provided, interpolates toward those values.
 * Otherwise, applies gentle idle animation.
 */
function AnimationWrapper({ isActive, headPose, children }: AnimationWrapperProps) {
  const groupRef = useRef<Group>(null);
  const timeOffset = useRef(Math.random() * Math.PI * 2);

  // Target rotation for interpolation
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  // Current smoothed rotation
  const currentRotation = useRef({ x: 0, y: 0, z: 0 });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime() + timeOffset.current;

    // Breathing motion - always active for liveliness
    const breathingSpeed = isActive ? 1.2 : 0.6;
    const breathingAmplitude = isActive ? 0.02 : 0.01;
    groupRef.current.position.y = Math.sin(t * breathingSpeed) * breathingAmplitude;

    if (headPose) {
      // Apply headPose from motion tracking
      targetRotation.current.x = headPose[0];
      targetRotation.current.y = headPose[1];
      targetRotation.current.z = headPose[2];
    } else {
      // Idle animation - subtle rotation
      const rotationIntensity = isActive ? 1.5 : 1.0;
      targetRotation.current.y = Math.sin(t * 0.3) * 0.04 * rotationIntensity;
      targetRotation.current.x = Math.sin(t * 0.4) * 0.02 * rotationIntensity;
      targetRotation.current.z = 0;
    }

    // Interpolate toward target (smooth animation)
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * LERP_FACTOR;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * LERP_FACTOR;
    currentRotation.current.z += (targetRotation.current.z - currentRotation.current.z) * LERP_FACTOR;

    // Apply smoothed rotation
    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;
    groupRef.current.rotation.z = currentRotation.current.z;
  });

  return <group ref={groupRef}>{children}</group>;
}

// -----------------------------------------------------------------------------
// Scene Content
// -----------------------------------------------------------------------------

interface AvatarSceneProps {
  isActive: boolean;
  blendshapes?: Record<string, number>;
  headPose?: [number, number, number];
}

function AvatarScene({ isActive, blendshapes, headPose }: AvatarSceneProps) {
  const { GlyphRenderer } = useSentinelDependencies();

  // Future: Pass blendshapes to GlyphRenderer for facial expressions
  // This requires GlyphRenderer to support blendshape morphing
  // For now, we only use headPose for head movement

  return (
    <>
      {/* Golden ambient lighting to match Backbay aesthetic */}
      <ambientLight intensity={0.35} color="#f5e6c8" />

      {/* Primary key light - warm golden */}
      <directionalLight
        position={[2, 2, 4]}
        intensity={0.9}
        color="#d4a84b"
      />

      {/* Subtle fill light from below - cooler tone for depth */}
      <directionalLight
        position={[-1, -1, 2]}
        intensity={0.25}
        color="#8aa4c4"
      />

      {/* Rim light for silhouette separation */}
      <pointLight
        position={[0, 1, -2]}
        intensity={isActive ? 0.6 : 0.3}
        color="#f2c96b"
        distance={8}
        decay={2}
      />

      {/* Avatar with motion animation */}
      <AnimationWrapper isActive={isActive} headPose={headPose}>
        {GlyphRenderer && (
          <GlyphRenderer
            variant="sentinel"
            scale={1.4}
            position={[0, -0.1, 0]}
            state={isActive ? 'listening' : 'idle'}
          />
        )}
      </AnimationWrapper>
    </>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

/**
 * AvatarRenderer - Renders a 3D avatar placeholder using an injected GlyphRenderer.
 *
 * Fills its parent container with a transparent Canvas.
 * Designed for a ~360px container (head/bust view).
 *
 * When blendshapes and headPose are provided (from avatar session),
 * the avatar will animate based on real-time motion tracking data.
 *
 * @example
 * <div style={{ width: 360, height: 360 }}>
 *   <AvatarRenderer
 *     isActive={isListening}
 *     blendshapes={{ mouthSmileLeft: 0.5, eyeBlinkLeft: 0.2 }}
 *     headPose={[0.1, -0.2, 0]}
 *   />
 * </div>
 */
export const AvatarRenderer: React.FC<AvatarRendererProps> = (props) => {
  const { isActive = false, blendshapes, headPose } = props;
  return (
    <Canvas
      camera={{
        position: [0, 0, 3.5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
    >
      <AvatarScene isActive={isActive} blendshapes={blendshapes} headPose={headPose} />
    </Canvas>
  );
};

export default AvatarRenderer;
