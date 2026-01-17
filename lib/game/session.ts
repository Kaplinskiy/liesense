import { cookies } from "next/headers";
import type { SessionPayload } from "@/lib/types/api";
import { getOrCreateGuestId } from "@/lib/utils/guest";

const SESSION_LENGTH = Number(process.env.SESSION_LENGTH ?? 7);

export async function getSession(params: {
  mode: "regular" | "daily" | "duel";
  duelToken?: string;
  date?: string;
}): Promise<SessionPayload> {
  const guestId = ensureGuestId();
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/session/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-guest-id": guestId
    },
    body: JSON.stringify({
      mode: params.mode,
      duelToken: params.duelToken,
      date: params.date,
      numQuestions: SESSION_LENGTH
    })
  });

  if (!response.ok) {
    throw new Error("Failed to start session");
  }

  return (await response.json()) as SessionPayload;
}

function ensureGuestId() {
  const store = cookies();
  const existing = store.get("guest_id");
  if (existing?.value) return existing.value;
  const gid = getOrCreateGuestId();
  return gid;
}
