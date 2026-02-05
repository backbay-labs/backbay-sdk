"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export interface VideoBackgroundProps {
  /** Source URL for the video (MP4 preferred) */
  videoSrc: string;
  /** WebM fallback source URL (optional, for better browser support) */
  webmSrc?: string;
  /** Poster image shown during loading and as fallback */
  posterSrc: string;
  /** Fallback CSS background (used behind poster/video, and if assets 404) */
  fallbackBackground?: string;
  /** Additional CSS classes */
  className?: string;
  /** Duration of the crossfade animation in seconds (default: 0.8) */
  crossfadeDuration?: number;
  /** Whether to add preload hints for video and poster (default: true) */
  preload?: boolean;
  /** Video playback rate (default: 1.0, use 0.5 for half speed) */
  playbackRate?: number;
  /** Callback fired when video successfully loads */
  onLoad?: () => void;
  /** Callback fired when video fails to load */
  onError?: (error: Event) => void;
}

/**
 * A fullscreen video background with crossfade loading animation.
 * Falls back to poster image if video fails to load.
 *
 * Features:
 * - Crossfade from poster to video when canplaythrough fires
 * - Graceful fallback to poster on video error
 * - Reduces motion for accessibility when user prefers reduced motion
 * - Optimized with playsInline, muted, autoPlay, loop attributes
 * - Optional preload hints for faster loading
 * - WebM format support for better compression
 */
export function VideoBackground({
  videoSrc,
  webmSrc,
  posterSrc,
  fallbackBackground,
  className,
  crossfadeDuration = 0.8,
  preload = true,
  playbackRate = 0.75,
  onLoad,
  onError,
}: VideoBackgroundProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleCanPlayThrough = useCallback(() => {
    setIsVideoReady(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      setHasError(true);
      setIsVideoReady(false);
      onError?.(e.nativeEvent);
    },
    [onError]
  );

  // Attempt to play video when it becomes visible and set playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || prefersReducedMotion) return;

    // Set playback rate
    video.playbackRate = playbackRate;

    // Some browsers require user interaction before autoplay works
    // This attempts to play and silently handles any autoplay restrictions
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented, video will show poster instead
        // This is expected behavior on some mobile browsers
      });
    }
  }, [hasError, prefersReducedMotion, playbackRate]);

  // Add preload hints to document head for faster loading
  useEffect(() => {
    if (!preload || typeof document === "undefined") return;

    const links: HTMLLinkElement[] = [];

    // Preload poster image
    if (posterSrc) {
      const posterLink = document.createElement("link");
      posterLink.rel = "preload";
      posterLink.as = "image";
      posterLink.href = posterSrc;
      document.head.appendChild(posterLink);
      links.push(posterLink);
    }

    // Preload primary video
    if (videoSrc) {
      const videoLink = document.createElement("link");
      videoLink.rel = "preload";
      videoLink.as = "video";
      videoLink.href = videoSrc;
      if (videoSrc.endsWith(".mp4")) {
        videoLink.type = "video/mp4";
      } else if (videoSrc.endsWith(".webm")) {
        videoLink.type = "video/webm";
      }
      document.head.appendChild(videoLink);
      links.push(videoLink);
    }

    // Preload WebM fallback if provided
    if (webmSrc) {
      const webmLink = document.createElement("link");
      webmLink.rel = "preload";
      webmLink.as = "video";
      webmLink.href = webmSrc;
      webmLink.type = "video/webm";
      document.head.appendChild(webmLink);
      links.push(webmLink);
    }

    return () => {
      links.forEach((link) => {
        if (link.parentNode === document.head) {
          document.head.removeChild(link);
        }
      });
    };
  }, [preload, videoSrc, webmSrc, posterSrc]);

  // Shared styles for both video and fallback
  const mediaStyles = cn(
    "absolute inset-0 w-full h-full object-cover",
    className
  );

  const fallbackBg =
    fallbackBackground ??
    "radial-gradient(1200px 700px at 50% 30%, rgba(255,255,255,0.10), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0) 40%), #000";

  // Use multiple backgrounds so if the poster 404s, the fallback still paints.
  const posterBackgroundImage = posterSrc ? `url(${posterSrc}), ${fallbackBg}` : fallbackBg;
  const posterBackgroundSize = posterSrc ? "cover, cover" : "cover";
  const posterBackgroundPosition = posterSrc ? "center, center" : "center";

  // If user prefers reduced motion, just show the poster
  if (prefersReducedMotion) {
    return (
      <div
        className={mediaStyles}
        style={{
          backgroundImage: posterBackgroundImage,
          backgroundSize: posterBackgroundSize,
          backgroundPosition: posterBackgroundPosition,
        }}
        role="img"
        aria-label="Background image"
      />
    );
  }

  return (
    <>
      {/* Poster fallback - always rendered underneath */}
      <div
        className={cn(mediaStyles, "z-0")}
        style={{
          backgroundImage: posterBackgroundImage,
          backgroundSize: posterBackgroundSize,
          backgroundPosition: posterBackgroundPosition,
        }}
        role="img"
        aria-hidden={isVideoReady && !hasError}
      />

      {/* Video layer with crossfade */}
      <AnimatePresence>
        {!hasError && (
          <motion.video
            ref={videoRef}
            key={videoSrc}
            className={cn(mediaStyles, "z-10")}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            onCanPlayThrough={handleCanPlayThrough}
            onError={handleError}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVideoReady ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: {
                duration: crossfadeDuration,
                ease: [0.4, 0, 0.2, 1], // ease-out cubic
              },
            }}
            aria-hidden="true"
          >
            {/* WebM format first (better compression, preferred by modern browsers) */}
            {webmSrc && <source src={webmSrc} type="video/webm" />}
            {/* MP4 fallback for broader compatibility */}
            <source src={videoSrc} type="video/mp4" />
          </motion.video>
        )}
      </AnimatePresence>
    </>
  );
}

export default VideoBackground;
