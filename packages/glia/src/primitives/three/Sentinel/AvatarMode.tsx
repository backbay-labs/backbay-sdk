'use client';

/**
 * AvatarMode
 *
 * Full-screen avatar display with camera PIP for face tracking.
 * Supports real-time motion streaming via optional useAvatarSession dependency.
 */

import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

import { useSentinelStore } from './sentinelStore';
import { useSentinelDependencies } from './SentinelProvider';
import { AvatarRenderer } from './AvatarRenderer';
import { CameraPip } from './CameraPip';
import { useCameraPermission } from './useCameraPermission';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const AVATAR_SIZE = 360;
const PIP_SIZE = 80;

// -----------------------------------------------------------------------------
// Keyframes
// -----------------------------------------------------------------------------

const glowPulse = keyframes`
  0%, 100% {
    box-shadow:
      0 0 40px rgba(212, 168, 75, 0.15),
      0 0 80px rgba(212, 168, 75, 0.08),
      inset 0 0 20px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 60px rgba(212, 168, 75, 0.25),
      0 0 100px rgba(212, 168, 75, 0.12),
      inset 0 0 30px rgba(0, 0, 0, 0.4);
  }
`;

// -----------------------------------------------------------------------------
// Styled Components
// -----------------------------------------------------------------------------

const AvatarContainer = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border-radius: 50%;
  background: linear-gradient(160deg, rgba(0, 0, 0, 0.7), rgba(8, 8, 10, 0.9));
  border: 2px solid rgba(212, 168, 75, 0.4);
  backdrop-filter: blur(20px);
  z-index: 9800;
  overflow: hidden;
  animation: ${glowPulse} 4s ease-in-out infinite;
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(212, 168, 75, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: rgba(212, 168, 75, 0.8);
  font-size: 18px;
  font-weight: 300;
  padding: 0;
  outline: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: rgba(212, 168, 75, 0.15);
    border-color: rgba(212, 168, 75, 0.6);
    color: rgba(212, 168, 75, 1);
  }
`;

const PipContainer = styled(motion.div)`
  position: absolute;
  bottom: 24px;
  left: 24px;
  width: ${PIP_SIZE}px;
  height: ${PIP_SIZE}px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(212, 168, 75, 0.25);
  overflow: hidden;
  z-index: 5;
`;

const AvatarWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
`;

// Permission prompt styles
const PermissionCard = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 340px;
  padding: 32px;
  background: linear-gradient(160deg, rgba(8, 8, 12, 0.95), rgba(12, 12, 16, 0.98));
  border: 1px solid rgba(212, 168, 75, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  z-index: 9800;
  box-shadow:
    0 0 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(212, 168, 75, 0.08);
`;

const PermissionTitle = styled.h3`
  margin: 0 0 12px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(212, 168, 75, 0.9);
`;

const PermissionText = styled.p`
  margin: 0 0 24px;
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const PermissionButton = styled(motion.button)<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  ${({ $primary }) =>
    $primary
      ? `
    background: rgba(212, 168, 75, 0.15);
    border: 1px solid rgba(212, 168, 75, 0.5);
    color: rgba(212, 168, 75, 1);

    &:hover {
      background: rgba(212, 168, 75, 0.25);
      border-color: rgba(212, 168, 75, 0.7);
    }
  `
      : `
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
  `}
`;

// Error state styles
const ErrorCard = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  padding: 28px;
  background: linear-gradient(160deg, rgba(12, 8, 8, 0.95), rgba(16, 12, 12, 0.98));
  border: 1px solid rgba(180, 80, 80, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  z-index: 9800;
  text-align: center;
`;

const ErrorIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(180, 80, 80, 0.1);
  border: 1px solid rgba(180, 80, 80, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(180, 80, 80, 0.8);
  font-size: 20px;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(180, 80, 80, 0.9);
`;

const ErrorText = styled.p`
  margin: 0 0 20px;
  font-family: var(--font-sans);
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.5);
`;

const DismissButton = styled(motion.button)`
  padding: 10px 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }
`;

// -----------------------------------------------------------------------------
// Animation Variants
// -----------------------------------------------------------------------------

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const pipVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.2,
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: 0.1,
    },
  },
};

// -----------------------------------------------------------------------------
// Frame Capture Interval
// -----------------------------------------------------------------------------

const FRAME_CAPTURE_INTERVAL_MS = 100; // 10 FPS for motion capture

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const AvatarMode: React.FC = () => {
  const phase = useSentinelStore((s) => s.phase);
  const exitAvatarMode = useSentinelStore((s) => s.exitAvatarMode);
  const { useAvatarSession, AvatarRenderer: DependencyAvatarRenderer } = useSentinelDependencies();
  const globalAvatarRenderer =
    typeof window !== 'undefined' ? (window as { __bbAvatarRenderer?: typeof AvatarRenderer }).__bbAvatarRenderer : undefined;
  const AvatarRendererComponent = globalAvatarRenderer ?? DependencyAvatarRenderer ?? AvatarRenderer;

  // Use the camera permission hook for stream management
  const { permission, stream, requestPermission, stopStream } = useCameraPermission();

  // Use the optional avatar session hook if provided
  // We use a placeholder userId - in production this would come from auth
  const avatarSession = useAvatarSession?.({ userId: 'avatar-user', autoConnect: false });

  // Refs for frame capture
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = phase === 'avatar';

  // Auto-request camera when permission is already granted and we enter avatar mode
  useEffect(() => {
    if (isVisible && permission === 'granted' && !stream) {
      requestPermission();
    }
  }, [isVisible, permission, stream, requestPermission]);

  // Connect to avatar session when stream is available
  useEffect(() => {
    if (isVisible && stream && avatarSession && !avatarSession.isConnected) {
      avatarSession.connect();
    }
  }, [isVisible, stream, avatarSession]);

  // Setup frame capture when stream and session are ready
  useEffect(() => {
    if (!stream || !avatarSession?.isConnected) {
      // Clear existing interval
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      return;
    }

    // Create video element if not exists
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }

    // Create canvas for frame capture
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 320; // Lower resolution for processing
      canvasRef.current.height = 240;
    }

    // Set video source
    videoRef.current.srcObject = stream;

    // Start frame capture interval
    captureIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !avatarSession) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Convert to base64
      const frameData = canvasRef.current.toDataURL('image/jpeg', 0.7).split(',')[1];

      // Upload frame (fire and forget, don't await)
      avatarSession.uploadFrame(frameData).catch((err) => {
        console.error('Failed to upload frame:', err);
      });
    }, FRAME_CAPTURE_INTERVAL_MS);

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [stream, avatarSession]);

  // Stop stream and disconnect session when leaving avatar mode
  useEffect(() => {
    if (!isVisible) {
      if (stream) {
        stopStream();
      }
      if (avatarSession?.isConnected) {
        avatarSession.disconnect();
      }
    }
  }, [isVisible, stream, stopStream, avatarSession]);

  const handleAllowCamera = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  const handleDismiss = useCallback(() => {
    stopStream();
    avatarSession?.disconnect();
    exitAvatarMode();
  }, [exitAvatarMode, stopStream, avatarSession]);

  const handleClose = useCallback(() => {
    stopStream();
    avatarSession?.disconnect();
    exitAvatarMode();
  }, [exitAvatarMode, stopStream, avatarSession]);

  const handleToggleCamera = useCallback(() => {
    if (stream) {
      stopStream();
      avatarSession?.disconnect();
    } else {
      requestPermission();
    }
  }, [stream, stopStream, requestPermission, avatarSession]);

  // Don't render if not in avatar phase
  if (!isVisible) {
    return null;
  }

  // Render permission prompt
  if (permission === 'prompt') {
    return (
      <AnimatePresence>
        <PermissionCard
          key="permission-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <PermissionTitle>Camera Access</PermissionTitle>
          <PermissionText>
            Avatar mode uses your camera to animate a 3D avatar that mirrors your expressions and
            movements. Your video stays on your device.
          </PermissionText>
          <ButtonRow>
            <PermissionButton onClick={handleDismiss}>Not Now</PermissionButton>
            <PermissionButton $primary onClick={handleAllowCamera}>
              Allow Camera
            </PermissionButton>
          </ButtonRow>
        </PermissionCard>
      </AnimatePresence>
    );
  }

  // Render error state
  if (permission === 'denied') {
    return (
      <AnimatePresence>
        <ErrorCard
          key="error-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <ErrorIcon>!</ErrorIcon>
          <ErrorTitle>Camera Unavailable</ErrorTitle>
          <ErrorText>
            Camera access was denied. To use Avatar mode, please enable camera permissions in your
            browser settings.
          </ErrorText>
          <DismissButton whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDismiss}>
            Dismiss
          </DismissButton>
        </ErrorCard>
      </AnimatePresence>
    );
  }

  // Render avatar view (camera granted)
  return (
    <AnimatePresence>
      <AvatarContainer
        key="avatar-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <CloseButton
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          aria-label="Close avatar mode"
        >
          x
        </CloseButton>

        {/* 3D Avatar Renderer */}
        <AvatarWrapper>
          <AvatarRendererComponent
            isActive={!!stream}
            blendshapes={avatarSession?.motionData?.blendshapes}
            headPose={avatarSession?.motionData?.headPose}
            renderFrame={avatarSession?.renderFrame ?? undefined}
            stream={stream}
          />
        </AvatarWrapper>

        {/* Camera self-view in corner */}
        <PipContainer variants={pipVariants}>
          <CameraPip
            stream={stream}
            size={PIP_SIZE}
            onToggle={handleToggleCamera}
          />
        </PipContainer>
      </AvatarContainer>
    </AnimatePresence>
  );
};

export default AvatarMode;
