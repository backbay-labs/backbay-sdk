'use client';

/**
 * CameraPip
 *
 * Picture-in-picture camera view for the avatar mode.
 */

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import type { CameraPipProps } from './types';

const Container = styled.div<{ $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  overflow: hidden;
  background: #0a0a0f;
  border: 2px solid #c9a227;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(201, 162, 39, 0.15);
  position: relative;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;

const ToggleButton = styled.button`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(10, 10, 15, 0.7);
  color: #c9a227;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(201, 162, 39, 0.3);
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a3a4a;
  font-size: 24px;
`;

export const CameraPip: React.FC<CameraPipProps> = ({
  stream,
  size = 80,
  onToggle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
    } else {
      video.srcObject = null;
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <Container $size={size}>
      {stream ? (
        <Video ref={videoRef} autoPlay muted playsInline />
      ) : (
        <Placeholder>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </Placeholder>
      )}
      {onToggle && (
        <ToggleButton onClick={onToggle} aria-label="Toggle camera">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </ToggleButton>
      )}
    </Container>
  );
};

export default CameraPip;
