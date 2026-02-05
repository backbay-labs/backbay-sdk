/**
 * Camera Permission Hook
 *
 * Manages camera permission state and video stream lifecycle
 * for the Sentinel avatar mode.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import type { UseCameraPermissionReturn } from './types';
import { useSentinelStore } from './sentinelStore';

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useCameraPermission(): UseCameraPermissionReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const permission = useSentinelStore((state) => state.cameraPermission);
  const setCameraPermission = useSentinelStore((state) => state.setCameraPermission);

  // ---------------------------------------------------------------------------
  // Check initial permission state
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkPermission = async () => {
      // Check if permissions API is supported
      if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });

        // Map permission state
        const mapState = (state: PermissionState): 'prompt' | 'granted' | 'denied' => {
          switch (state) {
            case 'granted':
              return 'granted';
            case 'denied':
              return 'denied';
            default:
              return 'prompt';
          }
        };

        setCameraPermission(mapState(result.state));

        // Listen for permission changes
        result.addEventListener('change', () => {
          setCameraPermission(mapState(result.state));
        });
      } catch {
        // Permission query not supported for camera in some browsers
        // Fall back to prompt state
      }
    };

    checkPermission();
  }, [setCameraPermission]);

  // ---------------------------------------------------------------------------
  // Stop stream helper
  // ---------------------------------------------------------------------------
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Request permission and get stream
  // ---------------------------------------------------------------------------
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setError(null);

    // Check if getUserMedia is supported
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const errorMessage = 'Camera access is not supported in this browser';
      setError(errorMessage);
      setCameraPermission('denied');
      return false;
    }

    try {
      // Stop any existing stream first
      stopStream();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraPermission('granted');
      return true;
    } catch (err) {
      const error = err as Error;

      // Handle specific error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Camera permission was denied');
        setCameraPermission('denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setError('No camera device found');
        setCameraPermission('denied');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setError('Camera is already in use by another application');
        setCameraPermission('denied');
      } else if (error.name === 'OverconstrainedError') {
        setError('Camera does not meet the required constraints');
        setCameraPermission('denied');
      } else if (error.name === 'AbortError') {
        setError('Camera access was aborted');
        setCameraPermission('denied');
      } else {
        setError(error.message || 'Failed to access camera');
        setCameraPermission('denied');
      }

      return false;
    }
  }, [setCameraPermission, stopStream]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return {
    permission,
    stream,
    error,
    requestPermission,
    stopStream,
  };
}
