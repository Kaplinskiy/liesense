"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function usePostHog() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      loaded: (ph) => {
        if (typeof window !== "undefined") {
          ph.capture("$pageview");
        }
      }
    });

    return () => {
      if (typeof posthog.reset === "function") {
        posthog.reset();
      }
    };
  }, []);
}
