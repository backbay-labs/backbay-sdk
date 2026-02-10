'use client';

/**
 * SentinelConversation
 *
 * The conversation zone below the Sentinel orb, providing:
 * - Voice captions with word-by-word golden glow animation
 * - Optional command line text input
 * - Mic/text toggle sigils
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';

import { useSentinelStore } from './sentinelStore';

// =============================================================================
// Animation Keyframes
// =============================================================================

const resonancePulse = keyframes`
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.03);
  }
`;

const arcPulse = keyframes`
  0%, 100% {
    opacity: 0.5;
  }
  33% {
    opacity: 0.9;
  }
  66% {
    opacity: 0.6;
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 2px rgba(212, 168, 75, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 6px rgba(212, 168, 75, 0.7));
  }
`;

const activeGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 3px rgba(212, 168, 75, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(212, 168, 75, 0.8));
  }
`;

const inscriptionShimmer = keyframes`
  0% {
    stroke-dashoffset: 24;
  }
  100% {
    stroke-dashoffset: 0;
  }
`;

// =============================================================================
// Styled Components
// =============================================================================

const ConversationContainer = styled(motion.div)`
  position: absolute;
  top: calc(50% + 100px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 600px;
  padding: 0 24px;
  pointer-events: auto;
`;

const CaptionsZone = styled.div`
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const CaptionLine = styled(motion.p)`
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: rgba(212, 168, 75, 0.95);
  text-align: center;
  margin: 0;
  line-height: 1.5;
  text-shadow: 0 0 12px rgba(212, 168, 75, 0.6);

  @media (prefers-reduced-motion: reduce) {
    text-shadow: 0 0 8px rgba(212, 168, 75, 0.4);
  }
`;

const Word = styled(motion.span)`
  display: inline-block;
  margin-right: 0.3em;

  &:last-child {
    margin-right: 0;
  }
`;

const CommandLineContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 400px;
`;

const Prompt = styled.span`
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 16px;
  color: rgba(212, 168, 75, 0.7);
`;

const CommandInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 16px;
  color: rgba(212, 168, 75, 0.95);
  caret-color: rgba(212, 168, 75, 0.95);

  &::placeholder {
    color: rgba(212, 168, 75, 0.3);
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

// =============================================================================
// Mic Sigil Styled Components
// =============================================================================

const MicSvgContainer = styled(motion.svg)<{
  $isListening: boolean;
  $isMuted: boolean;
  $isClickable: boolean;
}>`
  display: block;
  flex-shrink: 0;
  cursor: ${({ $isClickable }: { $isClickable: boolean }) => ($isClickable ? 'pointer' : 'default')};
  transition: filter 0.3s ease, opacity 0.3s ease;

  ${({ $isMuted }: { $isMuted: boolean }) =>
    $isMuted &&
    css`
      opacity: 0.35;
      filter: grayscale(0.5);
    `}

  ${({ $isListening, $isMuted }: { $isListening: boolean; $isMuted: boolean }) =>
    $isListening &&
    !$isMuted &&
    css`
      animation: ${glowPulse} 2s ease-in-out infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
        filter: drop-shadow(0 0 4px rgba(212, 168, 75, 0.5));
      }
    `}
`;

const CenterDot = styled.circle<{ $isListening: boolean; $isMuted: boolean }>`
  fill: #d4a84b;
  transition: fill 0.3s ease;

  ${({ $isListening, $isMuted }: { $isListening: boolean; $isMuted: boolean }) =>
    $isListening &&
    !$isMuted &&
    css`
      animation: ${resonancePulse} 1.5s ease-in-out infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

const ResonanceArc = styled.path<{
  $isListening: boolean;
  $isMuted: boolean;
  $delay: number;
}>`
  fill: none;
  stroke: #d4a84b;
  stroke-linecap: round;
  transition: opacity 0.3s ease;

  ${({ $isListening, $isMuted, $delay }: { $isListening: boolean; $isMuted: boolean; $delay: number }) =>
    $isListening &&
    !$isMuted &&
    css`
      animation: ${arcPulse} 1.8s ease-in-out infinite;
      animation-delay: ${$delay}ms;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
        opacity: 0.7;
      }
    `}

  ${({ $isMuted }: { $isMuted: boolean }) =>
    $isMuted &&
    css`
      opacity: 0.25;
    `}
`;

const MuteSlash = styled(motion.line)`
  stroke: #d4a84b;
  stroke-width: 2;
  stroke-linecap: round;
`;

// =============================================================================
// Text Sigil Styled Components
// =============================================================================

const TextSvgContainer = styled(motion.svg)<{
  $isActive: boolean;
  $isClickable: boolean;
}>`
  display: block;
  flex-shrink: 0;
  cursor: ${({ $isClickable }: { $isClickable: boolean }) => ($isClickable ? 'pointer' : 'default')};
  transition: filter 0.3s ease, opacity 0.3s ease;

  ${({ $isActive }: { $isActive: boolean }) =>
    $isActive &&
    css`
      animation: ${activeGlow} 2.5s ease-in-out infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
        filter: drop-shadow(0 0 5px rgba(212, 168, 75, 0.6));
      }
    `}

  ${({ $isActive }: { $isActive: boolean }) =>
    !$isActive &&
    css`
      opacity: 0.6;

      &:hover {
        opacity: 1;
      }
    `}
`;

const BorderRing = styled.circle<{ $isActive: boolean }>`
  fill: none;
  stroke: #d4a84b;
  stroke-width: 1;
  transition: stroke-opacity 0.3s ease;
  stroke-opacity: ${({ $isActive }: { $isActive: boolean }) => ($isActive ? 0.8 : 0.3)};
`;

const QuillBody = styled.path<{ $isActive: boolean }>`
  fill: none;
  stroke: #d4a84b;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-opacity 0.3s ease;
  stroke-opacity: ${({ $isActive }: { $isActive: boolean }) => ($isActive ? 1 : 0.6)};
`;

const QuillTip = styled.path<{ $isActive: boolean }>`
  fill: #d4a84b;
  transition: fill-opacity 0.3s ease;
  fill-opacity: ${({ $isActive }: { $isActive: boolean }) => ($isActive ? 1 : 0.6)};
`;

const InscriptionLine = styled(motion.path)<{ $isActive: boolean }>`
  fill: none;
  stroke: #d4a84b;
  stroke-width: 1;
  stroke-linecap: round;
  stroke-dasharray: 3 2;
  transition: stroke-opacity 0.3s ease;
  stroke-opacity: ${({ $isActive }: { $isActive: boolean }) => ($isActive ? 0.9 : 0.3)};

  ${({ $isActive }: { $isActive: boolean }) =>
    $isActive &&
    css`
      animation: ${inscriptionShimmer} 1.5s linear infinite;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

const RunicMark = styled.path<{ $isActive: boolean }>`
  fill: none;
  stroke: #d4a84b;
  stroke-width: 1;
  stroke-linecap: round;
  transition: stroke-opacity 0.3s ease;
  stroke-opacity: ${({ $isActive }: { $isActive: boolean }) => ($isActive ? 0.7 : 0.25)};
`;

const ActiveDot = styled(motion.circle)`
  fill: #d4a84b;
`;

// =============================================================================
// Voice Captions Sub-component
// =============================================================================

interface VoiceCaptionsProps {
  text: string | null;
  onComplete?: () => void;
}

const VoiceCaptions: React.FC<VoiceCaptionsProps> = ({ text, onComplete }) => {
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!text) {
      setVisibleWords([]);
      setIsComplete(false);
      return;
    }

    const words = text.split(' ').filter(Boolean);
    setVisibleWords([]);
    setIsComplete(false);

    if (prefersReducedMotion) {
      // Instant reveal for reduced motion
      setVisibleWords(words);
      setIsComplete(true);
      lingerTimeoutRef.current = setTimeout(() => {
        onCompleteRef.current?.();
      }, 2000);
      return;
    }

    // Word-by-word reveal with 60ms stagger
    const wordDelay = 60;
    words.forEach((word, index) => {
      timeoutRef.current = setTimeout(() => {
        setVisibleWords((prev) => [...prev, word]);

        // After last word, mark complete and start linger timer
        if (index === words.length - 1) {
          setIsComplete(true);
          lingerTimeoutRef.current = setTimeout(() => {
            onCompleteRef.current?.();
          }, 2000);
        }
      }, index * wordDelay);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (lingerTimeoutRef.current) clearTimeout(lingerTimeoutRef.current);
    };
  }, [text, prefersReducedMotion]);

  if (!text || visibleWords.length === 0) return null;

  return (
    <CaptionLine
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {visibleWords.map((word, index) => (
        <Word
          key={`${word}-${index}`}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            textShadow: [
              '0 0 12px rgba(212, 168, 75, 0.6)',
              '0 0 20px rgba(212, 168, 75, 0.9)',
              '0 0 12px rgba(212, 168, 75, 0.6)',
            ]
          }}
          transition={{
            duration: 0.2,
            textShadow: { duration: 0.4, times: [0, 0.5, 1] }
          }}
        >
          {word}
        </Word>
      ))}
    </CaptionLine>
  );
};

// =============================================================================
// Mic Sigil Component
// =============================================================================

interface MicSigilProps {
  isListening: boolean;
  isMuted: boolean;
  size?: number;
  onClick?: () => void;
}

const MicSigil: React.FC<MicSigilProps> = ({
  isListening,
  isMuted,
  size = 32,
  onClick,
}) => {
  return (
    <MicSvgContainer
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      $isListening={isListening}
      $isMuted={isMuted}
      $isClickable={!!onClick}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      role={onClick ? 'button' : 'img'}
      aria-label={
        isMuted
          ? 'Microphone muted'
          : isListening
            ? 'Microphone listening'
            : 'Microphone inactive'
      }
    >
      {/* Center resonance point */}
      <CenterDot
        cx="24"
        cy="24"
        r="4"
        $isListening={isListening}
        $isMuted={isMuted}
      />

      {/* Inner ring */}
      <circle
        cx="24"
        cy="24"
        r="8"
        fill="none"
        stroke="#d4a84b"
        strokeWidth="1.5"
        opacity={isMuted ? 0.2 : 0.5}
      />

      {/* Resonance arcs */}
      <ResonanceArc
        d="M12 24 A12 12 0 0 1 24 12"
        strokeWidth="1.5"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={0}
        style={{ opacity: isMuted ? 0.2 : undefined }}
      />
      <ResonanceArc
        d="M24 12 A12 12 0 0 1 36 24"
        strokeWidth="1.5"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={150}
        style={{ opacity: isMuted ? 0.2 : undefined }}
      />
      <ResonanceArc
        d="M36 24 A12 12 0 0 1 24 36"
        strokeWidth="1.5"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={300}
        style={{ opacity: isMuted ? 0.2 : undefined }}
      />
      <ResonanceArc
        d="M24 36 A12 12 0 0 1 12 24"
        strokeWidth="1.5"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={450}
        style={{ opacity: isMuted ? 0.2 : undefined }}
      />

      {/* Outer resonance arcs */}
      <ResonanceArc
        d="M6 24 A18 18 0 0 1 24 6"
        strokeWidth="1"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={100}
        style={{ opacity: isMuted ? 0.15 : 0.4 }}
      />
      <ResonanceArc
        d="M24 6 A18 18 0 0 1 42 24"
        strokeWidth="1"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={250}
        style={{ opacity: isMuted ? 0.15 : 0.4 }}
      />
      <ResonanceArc
        d="M42 24 A18 18 0 0 1 24 42"
        strokeWidth="1"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={400}
        style={{ opacity: isMuted ? 0.15 : 0.4 }}
      />
      <ResonanceArc
        d="M24 42 A18 18 0 0 1 6 24"
        strokeWidth="1"
        $isListening={isListening}
        $isMuted={isMuted}
        $delay={550}
        style={{ opacity: isMuted ? 0.15 : 0.4 }}
      />

      {/* Mute indicator slash */}
      {isMuted && (
        <MuteSlash
          x1="10"
          y1="38"
          x2="38"
          y2="10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </MicSvgContainer>
  );
};

// =============================================================================
// Text Sigil Component
// =============================================================================

interface TextSigilProps {
  isActive: boolean;
  size?: number;
  onClick?: () => void;
}

const TextSigil: React.FC<TextSigilProps> = ({
  isActive,
  size = 32,
  onClick,
}) => {
  return (
    <TextSvgContainer
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      $isActive={isActive}
      $isClickable={!!onClick}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      role={onClick ? 'button' : 'img'}
      aria-label={isActive ? 'Text input active' : 'Text input inactive'}
    >
      {/* Outer border ring */}
      <BorderRing cx="24" cy="24" r="21" $isActive={isActive} />

      {/* Inner decorative ring */}
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke="#d4a84b"
        strokeWidth="0.5"
        strokeDasharray="2 4"
        opacity={isActive ? 0.4 : 0.15}
      />

      {/* Stylized quill / inscription tool */}
      <QuillBody d="M14 34 L26 22 L30 18" $isActive={isActive} />
      <QuillBody
        d="M30 18 Q34 16 36 12"
        $isActive={isActive}
        style={{ strokeWidth: 1 }}
      />
      <QuillBody
        d="M30 18 Q32 14 30 10"
        $isActive={isActive}
        style={{ strokeWidth: 1 }}
      />
      <QuillBody
        d="M30 18 Q36 18 38 14"
        $isActive={isActive}
        style={{ strokeWidth: 1, strokeOpacity: isActive ? 0.7 : 0.4 }}
      />

      {/* Quill nib/tip */}
      <QuillTip d="M14 34 L12 36 L14 38 L16 36 Z" $isActive={isActive} />

      {/* Inscription line being written */}
      <InscriptionLine d="M16 38 L32 38" $isActive={isActive} />

      {/* Runic accent marks */}
      <RunicMark d="M20 32 L22 30" $isActive={isActive} />
      <RunicMark d="M24 28 L26 26" $isActive={isActive} />

      {/* Small decorative dots at cardinal positions */}
      <circle
        cx="24"
        cy="6"
        r="1"
        fill="#d4a84b"
        opacity={isActive ? 0.6 : 0.2}
      />
      <circle
        cx="42"
        cy="24"
        r="1"
        fill="#d4a84b"
        opacity={isActive ? 0.6 : 0.2}
      />
      <circle
        cx="6"
        cy="24"
        r="1"
        fill="#d4a84b"
        opacity={isActive ? 0.6 : 0.2}
      />

      {/* Active state indicator dot */}
      {isActive && (
        <ActiveDot
          cx="38"
          cy="38"
          r="2.5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            scale: { duration: 0.2 },
            opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      )}
    </TextSvgContainer>
  );
};

// =============================================================================
// Main Component
// =============================================================================

interface SentinelConversationProps {
  onSend?: (message: string) => void;
}

export const SentinelConversation: React.FC<SentinelConversationProps> = ({ onSend }) => {
  const conversationState = useSentinelStore((s) => s.conversationState);
  const isTextInputEnabled = useSentinelStore((s) => s.isTextInputEnabled);
  const isMuted = useSentinelStore((s) => s.isMuted);
  const toggleTextInput = useSentinelStore((s) => s.toggleTextInput);
  const toggleMute = useSentinelStore((s) => s.toggleMute);
  const currentCaption = useSentinelStore((s) => s.currentCaption);
  const setCurrentCaption = useSentinelStore((s) => s.setCurrentCaption);

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when text input is enabled
  useEffect(() => {
    if (isTextInputEnabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTextInputEnabled]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    onSend?.(inputValue.trim());
    setInputValue('');
  }, [inputValue, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleTextInput();
    }
  }, [toggleTextInput]);

  const handleCaptionComplete = useCallback(() => {
    // Clear caption after it's done displaying
    setCurrentCaption(null);
  }, [setCurrentCaption]);

  const isListening = conversationState === 'listening';

  return (
    <ConversationContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Captions Zone */}
      <CaptionsZone>
        <AnimatePresence mode="wait">
          {currentCaption && (
            <VoiceCaptions
              key={currentCaption}
              text={currentCaption}
              onComplete={handleCaptionComplete}
            />
          )}
        </AnimatePresence>
      </CaptionsZone>

      {/* Command Line (when enabled) */}
      <AnimatePresence>
        {isTextInputEnabled && (
          <CommandLineContainer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <Prompt>&gt;</Prompt>
              <CommandInput
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          </CommandLineContainer>
        )}
      </AnimatePresence>

      {/* Control Sigils */}
      <ControlsRow>
        <MicSigil
          isListening={isListening}
          isMuted={isMuted}
          onClick={toggleMute}
          size={32}
        />
        <TextSigil
          isActive={isTextInputEnabled}
          onClick={toggleTextInput}
          size={32}
        />
      </ControlsRow>
    </ConversationContainer>
  );
};

export default SentinelConversation;
