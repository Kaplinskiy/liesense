"use client";

import { ReactNode } from "react";
import { usePostHog } from "@/lib/analytics/browser";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  usePostHog();
  return <>{children}</>;
}
