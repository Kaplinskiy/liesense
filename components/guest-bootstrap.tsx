"use client";

import { useEffect } from "react";

export function GuestBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "guest_id";
    let gid = window.localStorage.getItem(key);
    if (!gid) {
      gid = crypto.randomUUID();
      window.localStorage.setItem(key, gid);
    }
    document.cookie = `${key}=${gid};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  }, []);

  return null;
}
