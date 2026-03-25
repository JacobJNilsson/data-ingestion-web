"use client";

import { useEffect, useRef } from "react";
import { DATA_INGESTION_API_URL } from "@/lib/constants";

const HEALTH_URL = `${DATA_INGESTION_API_URL}/health`;
const RETRY_DELAY_MS = 5_000;
const MAX_RETRIES = 3;
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Pings the API health endpoint on mount to wake the backend from sleep.
 * Retries on failure (Koyeb free tier returns 503 on cold start).
 * Re-pings when the page becomes visible after being hidden for 5+ minutes.
 * Does not ping while the page is in the background.
 */
export function useHealthPing() {
  const lastSuccessRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;
        try {
          const resp = await fetch(HEALTH_URL, { method: "GET" });
          if (resp.ok) {
            lastSuccessRef.current = Date.now();
            return;
          }
        } catch {
          // Network error -- retry.
        }
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }

    // Ping on mount.
    ping();

    // Re-ping when page becomes visible after being hidden for a while.
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - lastSuccessRef.current;
      if (elapsed > STALE_THRESHOLD_MS) {
        ping();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
