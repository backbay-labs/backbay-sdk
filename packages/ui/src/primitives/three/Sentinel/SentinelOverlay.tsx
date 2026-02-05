'use client';

/**
 * SentinelOverlay
 *
 * The main overlay container for the Sentinel orb and menu system.
 * Handles backdrop, escape key dismissal, and rendering sub-components.
 * Includes ambient greeting and conversation zone.
 */

import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useCallback, useState } from 'react';
import styled from 'styled-components';

import { useSentinelStore } from './sentinelStore';
import { AvatarMode } from './AvatarMode';
import { CardinalMenu } from './CardinalMenu';
import { SentinelConversation } from './SentinelConversation';
import { SentinelOrb } from './SentinelOrb';
import { SentinelTether } from './SentinelTether';

// -----------------------------------------------------------------------------
// Styled Components
// -----------------------------------------------------------------------------

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: auto;
`;

const OverlayContainer = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9500;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
`;

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const SentinelOverlay: React.FC = () => {
  const phase = useSentinelStore((s) => s.phase);
  const dismiss = useSentinelStore((s) => s.dismiss);
  const visibleCardinals = useSentinelStore((s) => s.visibleCardinals);
  const docket = useSentinelStore((s) => s.docket);
  const setCurrentCaption = useSentinelStore((s) => s.setCurrentCaption);

  const [isEditMode, setIsEditMode] = useState(false);

  const isVisible = phase !== 'docked';
  const isAvatarMode = phase === 'avatar';
  const canDismiss = phase === 'open' || phase === 'avatar';

  // Filter docket items to only show visible cardinals
  const arcItems = docket.filter((item) => visibleCardinals.includes(item.id));

  // Trigger ambient greeting on summon
  useEffect(() => {
    if (phase === 'open') {
      // Small delay to let the animation settle
      const timer = setTimeout(() => {
        const greetings = [
          'What can I help you with?',
          'Ready when you are.',
          'How can I assist?',
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setCurrentCaption(greeting);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, setCurrentCaption]);

  // Handle escape key to dismiss
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canDismiss) {
        dismiss();
      }
    },
    [canDismiss, dismiss]
  );

  useEffect(() => {
    if (isVisible && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscapeKey);
      return () => window.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isVisible, handleEscapeKey]);


  // Handle click outside (on backdrop) to dismiss
  const handleBackdropClick = useCallback(() => {
    if (canDismiss) {
      dismiss();
    }
  }, [canDismiss, dismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <Backdrop
            key="sentinel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleBackdropClick}
          />
          <OverlayContainer
            key="sentinel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isAvatarMode ? (
              <AvatarMode />
            ) : (
              <>
                <SentinelTether />
                <SentinelOrb />
                <CardinalMenu
                  items={arcItems}
                  onEdit={() => setIsEditMode(true)}
                />
                <SentinelConversation />
              </>
            )}
          </OverlayContainer>
        </>
      )}
    </AnimatePresence>
  );
};

export default SentinelOverlay;
