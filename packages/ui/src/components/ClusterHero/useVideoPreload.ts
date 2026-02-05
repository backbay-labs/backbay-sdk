"use client";

import { useEffect, useState } from "react";

export interface UseVideoPreloadOptions {
  /** Video source URL to preload */
  videoSrc: string;
  /** Poster image source URL to preload */
  posterSrc: string;
  /** Whether preloading is enabled (default: true) */
  enabled?: boolean;
}

export interface UseVideoPreloadResult {
  /** Whether the assets have been preloaded */
  isPreloaded: boolean;
}

/**
 * Custom hook to preload video and poster assets.
 * Adds <link rel="preload"> hints to the document head for faster loading.
 * Cleans up preload hints on unmount.
 *
 * @example
 * ```tsx
 * const { isPreloaded } = useVideoPreload({
 *   videoSrc: '/videos/hero.mp4',
 *   posterSrc: '/images/hero-poster.jpg',
 * });
 * ```
 */
export function useVideoPreload({
  videoSrc,
  posterSrc,
  enabled = true,
}: UseVideoPreloadOptions): UseVideoPreloadResult {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") {
      return;
    }

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

    // Preload video
    if (videoSrc) {
      const videoLink = document.createElement("link");
      videoLink.rel = "preload";
      videoLink.as = "video";
      videoLink.href = videoSrc;
      // Set type hint for better browser optimization
      if (videoSrc.endsWith(".webm")) {
        videoLink.type = "video/webm";
      } else if (videoSrc.endsWith(".mp4")) {
        videoLink.type = "video/mp4";
      }
      document.head.appendChild(videoLink);
      links.push(videoLink);
    }

    setIsPreloaded(true);

    // Cleanup on unmount
    return () => {
      links.forEach((link) => {
        if (link.parentNode === document.head) {
          document.head.removeChild(link);
        }
      });
    };
  }, [videoSrc, posterSrc, enabled]);

  return { isPreloaded };
}

export default useVideoPreload;
