"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, prefersReducedMotion } from "../../../lib/utils";

/** Hook to detect reduced motion preference */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export interface VoiceCaptionsProps {
  /** The full text to display */
  text: string;
  /** Sync with audio playback state */
  isPlaying?: boolean;
  /** Words per second for timing sync (default ~2.5) */
  wordsPerSecond?: number;
  /** Callback when all text has been revealed and dissolved */
  onComplete?: () => void;
  /** Additional className for the container */
  className?: string;
  /** Max lines visible before older lines dissolve (default 3) */
  maxLines?: number;
}

interface CaptionLine {
  id: number;
  words: string[];
  phase: "entering" | "visible" | "exiting";
  revealedCount: number;
}

const WORD_STAGGER_MS = 60;
const GLOW_PULSE_MS = 200;
const LINGER_MS = 2000;
const DISSOLVE_MS = 400;
const WORDS_PER_LINE = 8;

const GOLDEN_COLOR = "rgba(212, 168, 75, 0.95)";
const GOLDEN_GLOW = "0 0 12px #d4a84b";
const GOLDEN_GLOW_INTENSE = "0 0 20px #d4a84b, 0 0 32px #d4a84b";

export const VoiceCaptions = ({
  text,
  isPlaying = true,
  wordsPerSecond = 2.5,
  onComplete,
  className,
  maxLines = 3,
}: VoiceCaptionsProps) => {
  const reducedMotion = useReducedMotion();
  const [lines, setLines] = useState<CaptionLine[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasCalledComplete = useRef(false);
  const lineIdCounter = useRef(0);

  const allWords = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean);
  }, [text]);

  // Reset state when text changes
  useEffect(() => {
    setLines([]);
    setCurrentWordIndex(0);
    setIsComplete(false);
    hasCalledComplete.current = false;
    lineIdCounter.current = 0;
  }, [text]);

  // Word reveal timing
  useEffect(() => {
    if (!isPlaying || isComplete || currentWordIndex >= allWords.length) return;

    const interval = reducedMotion
      ? 1000 / wordsPerSecond
      : WORD_STAGGER_MS;

    const timer = setTimeout(() => {
      setCurrentWordIndex((prev) => prev + 1);
    }, interval);

    return () => clearTimeout(timer);
  }, [isPlaying, currentWordIndex, allWords.length, isComplete, reducedMotion, wordsPerSecond]);

  // Manage lines based on current word index
  useEffect(() => {
    if (currentWordIndex === 0 && allWords.length > 0) {
      // Initialize first line
      const firstLineWords = allWords.slice(0, WORDS_PER_LINE);
      setLines([
        {
          id: lineIdCounter.current++,
          words: firstLineWords,
          phase: "entering",
          revealedCount: 0,
        },
      ]);
      return;
    }

    setLines((prevLines) => {
      const newLines = [...prevLines];
      let totalWordsInLines = 0;

      // Calculate revealed words per line
      for (let i = 0; i < newLines.length; i++) {
        const line = newLines[i];
        const lineStartIndex = i * WORDS_PER_LINE;
        const revealedInLine = Math.max(
          0,
          Math.min(currentWordIndex - lineStartIndex, line.words.length)
        );
        newLines[i] = {
          ...line,
          revealedCount: revealedInLine,
          phase: revealedInLine > 0 ? "visible" : line.phase,
        };
        totalWordsInLines += line.words.length;
      }

      // Check if we need a new line
      if (currentWordIndex >= totalWordsInLines && currentWordIndex < allWords.length) {
        const newLineStartIndex = totalWordsInLines;
        const newLineWords = allWords.slice(
          newLineStartIndex,
          newLineStartIndex + WORDS_PER_LINE
        );

        if (newLineWords.length > 0) {
          newLines.push({
            id: lineIdCounter.current++,
            words: newLineWords,
            phase: "entering",
            revealedCount: 0,
          });

          // Mark oldest line for exit if we exceed maxLines
          if (newLines.length > maxLines) {
            newLines[0] = { ...newLines[0], phase: "exiting" };
          }
        }
      }

      return newLines;
    });
  }, [currentWordIndex, allWords, maxLines]);

  // Remove exited lines after animation
  const handleExitComplete = useCallback((lineId: number) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  }, []);

  // Handle completion with linger
  useEffect(() => {
    if (currentWordIndex >= allWords.length && allWords.length > 0 && !isComplete) {
      const lingerTimer = setTimeout(() => {
        setIsComplete(true);
        // Dissolve all remaining lines
        setLines((prev) =>
          prev.map((line) => ({ ...line, phase: "exiting" as const }))
        );
      }, LINGER_MS);

      return () => clearTimeout(lingerTimer);
    }
  }, [currentWordIndex, allWords.length, isComplete]);

  // Call onComplete when all lines have dissolved
  useEffect(() => {
    if (isComplete && lines.length === 0 && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [isComplete, lines.length, onComplete]);

  // Reduced motion: instant reveal, simple fade
  if (reducedMotion) {
    return (
      <div
        className={cn(
          "voice-captions-container text-center",
          className
        )}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "18px",
          letterSpacing: "0.05em",
          color: GOLDEN_COLOR,
        }}
        role="status"
        aria-live="polite"
        aria-label="Voice captions"
      >
        <AnimatePresence mode="popLayout">
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={(definition) => {
                if (definition === "exit") {
                  handleExitComplete(line.id);
                }
              }}
              className="caption-line"
            >
              {line.words.slice(0, line.revealedCount).join(" ")}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "voice-captions-container text-center",
        className
      )}
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "18px",
        letterSpacing: "0.05em",
        color: GOLDEN_COLOR,
      }}
      role="status"
      aria-live="polite"
      aria-label="Voice captions"
    >
      <AnimatePresence mode="popLayout">
        {lines.map((line) => (
          <CaptionLineComponent
            key={line.id}
            line={line}
            onExitComplete={() => handleExitComplete(line.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface CaptionLineComponentProps {
  line: CaptionLine;
  onExitComplete: () => void;
}

const CaptionLineComponent = ({
  line,
  onExitComplete,
}: CaptionLineComponentProps) => {
  return (
    <motion.div
      className="caption-line mb-1"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        filter: "blur(4px)",
        textShadow: "0 0 0px transparent",
      }}
      transition={{
        duration: DISSOLVE_MS / 1000,
        ease: "easeOut",
      }}
      onAnimationComplete={(definition) => {
        if (definition === "exit") {
          onExitComplete();
        }
      }}
    >
      {line.words.map((word, wordIdx) => (
        <CaptionWord
          key={`${line.id}-${wordIdx}`}
          word={word}
          isRevealed={wordIdx < line.revealedCount}
          isLastRevealed={wordIdx === line.revealedCount - 1}
        />
      ))}
    </motion.div>
  );
};

interface CaptionWordProps {
  word: string;
  isRevealed: boolean;
  isLastRevealed: boolean;
}

const CaptionWord = ({ word, isRevealed, isLastRevealed }: CaptionWordProps) => {
  const [glowPhase, setGlowPhase] = useState<"intense" | "settled">("intense");

  useEffect(() => {
    if (isLastRevealed) {
      setGlowPhase("intense");
      const timer = setTimeout(() => {
        setGlowPhase("settled");
      }, GLOW_PULSE_MS);
      return () => clearTimeout(timer);
    }
  }, [isLastRevealed]);

  return (
    <motion.span
      className="inline-block mr-[0.25em]"
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={
        isRevealed
          ? {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              textShadow:
                isLastRevealed && glowPhase === "intense"
                  ? GOLDEN_GLOW_INTENSE
                  : GOLDEN_GLOW,
            }
          : { opacity: 0, y: 8, filter: "blur(4px)" }
      }
      transition={{
        opacity: { duration: 0.15, ease: "easeOut" },
        y: { duration: 0.2, ease: "easeOut" },
        filter: { duration: 0.2, ease: "easeOut" },
        textShadow: {
          duration: glowPhase === "intense" ? 0.1 : GLOW_PULSE_MS / 1000,
          ease: "easeOut",
        },
      }}
    >
      {word}
    </motion.span>
  );
};
