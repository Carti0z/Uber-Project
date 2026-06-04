"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoCoords } from "@/lib/geolocation";

export interface UseGeolocationOptions {
  enabled?: boolean;
  watch?: boolean;
  maximumAge?: number;
  timeout?: number;
  enableHighAccuracy?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enabled = true,
    watch = false,
    maximumAge = 10_000,
    timeout = 15_000,
    enableHighAccuracy = true,
  } = options;

  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const supported =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setCoords({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: "Location permission denied. Enable location in your browser settings.",
      2: "Location unavailable. Try again or move to an open area.",
      3: "Location request timed out. Please try again.",
    };
    setError(messages[err.code] || "Could not get your location");
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!supported) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      maximumAge,
      timeout,
    });
  }, [
    supported,
    enableHighAccuracy,
    maximumAge,
    timeout,
    handleSuccess,
    handleError,
  ]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!supported) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    if (watch) {
      setLoading(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy, maximumAge, timeout }
      );
      return () => {
        if (watchIdRef.current != null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }

    refresh();
  }, [
    enabled,
    watch,
    supported,
    refresh,
    handleSuccess,
    handleError,
    enableHighAccuracy,
    maximumAge,
    timeout,
  ]);

  return { coords, loading, error, refresh, supported };
}
